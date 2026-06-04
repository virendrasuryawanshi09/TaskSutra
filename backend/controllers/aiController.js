const Task = require('../models/Task');
const User = require('../models/User');
const { getTeamWorkloads } = require('./userController');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { validatePipeline } = require('../services/queryValidator');
const {
    queryGroq,
    queryGroqEngine,
    extractJSON,
    convertToObjectId,
    buildNLQueryPrompt
} = require('../services/aiService');
const {
    calculateLocalRecommendations,
    calculateLocalCognitiveLoad
} = require('../utils/localMetricsHelper');

exports.generateOrgHealthReport = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        if (!companyId) {
            return res.status(400).json({ success: false, message: "User is not associated with a company." });
        }

        const now = new Date();

        const [totalTasks, completedTasksCount, pendingTasksCount, inProgressTasksCount, overdueTasksCount] =
            await Promise.all([
                Task.countDocuments({ companyId }),
                Task.countDocuments({ companyId, status: 'Completed' }),
                Task.countDocuments({ companyId, status: 'Pending' }),
                Task.countDocuments({ companyId, status: 'In-progress' }),
                Task.countDocuments({ companyId, status: { $ne: 'Completed' }, dueDate: { $lt: now } })
            ]);

        const overdueTasks = await Task.find({
            companyId,
            status: { $ne: 'Completed' },
            dueDate: { $lt: now }
        }).select('title description priority');

        const failedTasksSummary = overdueTasks.map(t => ({
            title: t.title,
            description: t.description || '',
            priority: t.priority
        }));

        const teamMembers = await User.find({ companyId, role: 'member' }).select('name title');
        const teamBurnoutMetrics = await Promise.all(teamMembers.map(async (member) => {
            const [activeCount, highPriorityCount, overdueCount] = await Promise.all([
                Task.countDocuments({ companyId, assignedTo: member._id, status: { $in: ['Pending', 'In-progress'] } }),
                Task.countDocuments({ companyId, assignedTo: member._id, status: { $in: ['Pending', 'In-progress'] }, priority: 'High' }),
                Task.countDocuments({ companyId, assignedTo: member._id, status: { $ne: 'Completed' }, dueDate: { $lt: now } })
            ]);
            return {
                memberName: member.name,
                role: member.title || 'Team Member',
                activeTasks: activeCount,
                highPriorityTasks: highPriorityCount,
                overdueTasks: overdueCount
            };
        }));

        if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
            return res.status(500).json({ success: false, message: "No AI API keys configured on the server." });
        }

        const prompt = `You are a Chief Operations Officer (COO) and organization analyst. Analyze this company's performance telemetry:
- Total Tasks in System: ${totalTasks}
- Completed Tasks: ${completedTasksCount}
- Active Pending/In-Progress Tasks: ${pendingTasksCount + inProgressTasksCount}
- Overdue Tasks: ${overdueTasksCount}

Here are the details of Overdue/Delayed Tasks:
${JSON.stringify(failedTasksSummary, null, 2)}

Here is the current team workload distribution (for identifying potential burnout):
${JSON.stringify(teamBurnoutMetrics, null, 2)}

Based on this data, diagnose the company's operational health.
Identify the primary weakness causing delays and provide 3 actionable, specific, and realistic steps to overcome it.

You MUST respond strictly in a valid JSON object matching this schema:
{
  "overallHealthScore": <Integer between 0 and 100>,
  "primaryWeakness": "<String describing the core bottleneck>",
  "growthRecommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"]
}

Ensure your output has NO markdown wrapping. Output ONLY the JSON block.`;

        let responseText = "";
        let success = false;
        let lastError = null;

        if (process.env.GROQ_API_KEY) {
            try {
                responseText = await queryGroq(prompt);
                success = true;
            } catch (err) {
                console.warn("Groq failed for org health, trying Gemini...", err.message);
                lastError = err;
            }
        }

        if (!success && process.env.GEMINI_API_KEY) {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            for (const modelName of ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"]) {
                try {
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent(prompt);
                    responseText = result.response.text().trim();
                    success = true;
                    break;
                } catch (err) {
                    console.warn(`Gemini model ${modelName} failed:`, err.message);
                    lastError = err;
                }
            }
        }

        if (!success) {
            throw lastError || new Error("All AI services failed.");
        }

        responseText = responseText.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();

        let parsedReport;
        try {
            parsedReport = JSON.parse(responseText);
        } catch (parseError) {
            parsedReport = {
                overallHealthScore: Math.round(((completedTasksCount || 1) / (totalTasks || 1)) * 100),
                primaryWeakness: "Could not analyze weakness due to output formatting discrepancies.",
                growthRecommendations: [
                    "Ensure clear and well-scoped tasks with measurable milestones.",
                    "Rebalance high-priority tasks across members to prevent bottlenecking.",
                    "Review due dates regularly and adjust timeline expectations."
                ]
            };
        }

        return res.json({ success: true, data: parsedReport });

    } catch (error) {
        console.error("Org Health Diagnostic Error:", error);
        return res.status(500).json({ success: false, message: `AI Error: ${error.message}`, error: error.message });
    }
};

exports.recommendAssignees = async (req, res) => {
    try {
        const { title, description } = req.body;
        const companyId = req.user.companyId;

        if (!title) {
            return res.status(400).json({ success: false, message: "Task title is required." });
        }

        if (!companyId) {
            return res.status(400).json({ success: false, message: "User is not associated with a company." });
        }

        // 1. Fetch team workloads (all roles)
        const teamWorkloads = await getTeamWorkloads(companyId);
        if (teamWorkloads.length === 0) {
            return res.json({ success: true, data: [] });
        }

        // 2. Build AI prompt
        const prompt = `You are a project manager allocating a task to the most compatible team member.
Task details:
Title: "${title}"
Description: "${description || 'No description'}"

Here is the list of candidates with their skills, behavioral traits, and current active task load:
${JSON.stringify(teamWorkloads, null, 2)}

Evaluate compatibility based on:
1. Skills matching (match task requirements semantically against developer skill arrays).
2. Workload balance (penalize developers with higher active tasks to prevent burnout).

You must respond strictly in a valid JSON object matching this schema:
{
  "recommendations": [
    {
      "developerId": "<Developer _id>",
      "score": <Integer between 0 and 100>,
      "matchingSkills": ["<matched skill>"],
      "reasoning": "<Extremely short, under 15 words. Example: 'Complete skill match, but 2 active tasks reduce compatibility.'>"
    }
  ]
}

Ensure your output has NO markdown wrapping. Output ONLY the JSON block.`;

        // 3. Try Groq first, then Gemini, then local fallback
        let responseText = "";
        let success = false;
        let groqError = null;
        let lastError = null;

        if (process.env.GROQ_API_KEY) {
            try {
                responseText = await queryGroq(prompt);
                success = true;
            } catch (err) {
                console.warn("Groq query failed, trying Gemini...", err.message);
                groqError = err;
            }
        }

        if (!success && process.env.GEMINI_API_KEY) {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            for (const modelName of ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-pro"]) {
                try {
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent(prompt);
                    responseText = result.response.text().trim();
                    success = true;
                    break;
                } catch (err) {
                    console.warn(`Gemini model ${modelName} failed:`, err.message);
                    lastError = err;
                }
            }
        }

        let recommendations = [];

        if (!success) {
            const errMsg = groqError
                ? `Groq failed (${groqError.message}) and Gemini failed (${lastError ? lastError.message : "not configured"})`
                : `Gemini failed: ${lastError ? lastError.message : "not configured"}`;
            console.error("All AI services failed, using local fallback. Details:", errMsg);
            recommendations = calculateLocalRecommendations(teamWorkloads, title, description);
        } else {
            responseText = responseText.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
            try {
                const parsed = JSON.parse(responseText);
                if (parsed && Array.isArray(parsed.recommendations)) {
                    recommendations = parsed.recommendations;
                } else if (Array.isArray(parsed)) {
                    recommendations = parsed;
                } else {
                    throw new Error("Unexpected AI response structure.");
                }
            } catch (parseError) {
                console.error("Failed to parse AI response, using local fallback. Raw:", responseText);
                recommendations = calculateLocalRecommendations(teamWorkloads, title, description);
            }
        }

        // 4. Enrich with user details & calculate local cognitive load on-the-fly if cache is empty
        const enrichedRecommendations = await Promise.all(recommendations.map(async (rec) => {
            const devInfo = teamWorkloads.find(w => w._id.toString() === rec.developerId.toString());
            if (!devInfo) {
                return {
                    ...rec,
                    name: "Unknown",
                    title: "Team Member",
                    activeTasks: 0,
                    cognitiveProfile: {
                        cognitiveLoadScore: 0,
                        deliveryProbability: 100,
                        lastUpdated: null
                    }
                };
            }

            let cogProfile = devInfo.cognitiveProfile;

            // If cache is empty or has default 100% with active tasks, pre-calculate using local math engine
            if ((!cogProfile || !cogProfile.lastUpdated || (cogProfile.deliveryProbability === 100 && devInfo.activeTasks > 0)) && devInfo.activeTasks > 0) {
                try {
                    const activeTasks = await Task.find({
                        assignedTo: devInfo._id,
                        companyId,
                        status: { $in: ["Pending", "In-progress", "In Progress"] }
                    }).select("title description priority dueDate domain taskDna");

                    const deadlinesTimeline = activeTasks.map(t => ({
                        taskId: t._id.toString(),
                        title: t.title,
                        dueDate: t.dueDate,
                        priority: t.priority,
                        domain: t.domain || "Frontend",
                        complexity: t.taskDna?.estimatedComplexityScore || 5
                    })).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

                    const localAnalysis = calculateLocalCognitiveLoad(devInfo, activeTasks, deadlinesTimeline);

                    cogProfile = {
                        cognitiveLoadScore: localAnalysis.cognitiveLoadScore,
                        deliveryProbability: localAnalysis.deliveryProbability,
                        lastUpdated: new Date()
                    };

                    // Save cache in database in background
                    await User.updateOne({ _id: devInfo._id }, {
                        $set: { cognitiveProfile: cogProfile }
                    });
                } catch (err) {
                    console.warn(`Failed to pre-calculate cognitive load for ${devInfo.name}:`, err.message);
                }
            }

            return {
                ...rec,
                name: devInfo.name,
                title: devInfo.title,
                activeTasks: devInfo.activeTasks,
                cognitiveProfile: cogProfile
            };
        }));

        // 5. Sort by score descending
        const sortedRecommendations = enrichedRecommendations.sort((a, b) => b.score - a.score);

        return res.json({ success: true, data: sortedRecommendations });

    } catch (error) {
        console.error("Recommend Assignees Error:", error);
        return res.status(500).json({
            success: false,
            message: `AI Error: ${error.message}`,
            error: error.message
        });
    }
};

exports.getCognitiveLoadAnalysis = async (req, res) => {
    try {
        const { userId } = req.params;
        const companyId = req.user.companyId;

        if (!companyId) {
            return res.status(400).json({ success: false, message: "User is not associated with a company." });
        }

        const user = await User.findOne({ _id: userId, companyId }).select("name title skills behavioralProfile");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found or access denied." });
        }

        const activeTasks = await Task.find({
            assignedTo: userId,
            companyId,
            status: { $in: ["Pending", "In-progress", "In Progress"] }
        }).select("title description priority dueDate domain taskDna");

        const deadlinesTimeline = activeTasks.map(t => ({
            taskId: t._id.toString(),
            title: t.title,
            dueDate: t.dueDate,
            priority: t.priority,
            domain: t.domain || "Frontend",
            complexity: t.taskDna?.estimatedComplexityScore || 5
        })).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        // Let's call AI if keys are present, otherwise fallback to local calculation
        let resultData = null;
        let success = false;
        let lastError = null;

        if (process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY) {
            const prompt = `You are an AI Resource Planner and Cognitive Load Analyst. Analyze the workload of team member ${user.name} (${user.title || 'Developer'}) to determine their On-Time Delivery Probability and Cognitive Load.

Developer Behavioral Traits: ${JSON.stringify(user.behavioralProfile?.traits || ['Deep-Focus'])}
Performance Telemetry:
- Late Submission Rate: ${user.behavioralProfile?.performanceMetrics?.lateSubmissionRate || 0}%
- Avg Checklist Completion Time: ${user.behavioralProfile?.performanceMetrics?.avgChecklistCompletionTime || 0} hours
- Review Accuracy: ${user.behavioralProfile?.performanceMetrics?.reviewAccuracyRate || 100}%

Developer Skills: ${JSON.stringify(user.skills || [])}

Current Date: ${new Date().toISOString()}

Active Tasks Checklist & Deadlines Timeline:
${JSON.stringify(deadlinesTimeline, null, 2)}

Evaluation Criteria:
1. Delivery Probability (0-100%):
   - Start with base 100%.
   - Deduct for overdue tasks (current date > due date).
   - Deduct for scheduling overlaps (deadlines within 2 days of each other).
   - Deduct based on behavioral lateSubmissionRate.
   - Deduct 10 points for every additional technical domain beyond the first (context switching overhead).
2. Cognitive Load Score (0-100):
   - Increase based on task complexity scores, priority levels (High = +20, Medium = +10, Low = +5).
   - Increase for each domain shift required.
3. Scheduling Overlaps:
   - Identify specific dates where multiple tasks are due close to each other.
4. Warnings:
   - Provide concrete alerts for the manager if efficiency drops or deadlines are at risk.
5. Assessment:
   - Concise evaluation of developer's load in under 25 words.

You MUST respond strictly in a valid JSON object matching this schema:
{
  "deliveryProbability": <Integer between 0 and 100>,
  "cognitiveLoadScore": <Integer between 0 and 100>,
  "detectedDomains": ["<domain names matching active tasks>"],
  "contextSwitchPenalty": <Integer representing the penalty subtracted>,
  "schedulingOverlaps": [
    {
      "description": "<string describing overlap>"
    }
  ],
  "warnings": ["<string warning 1>", "<string warning 2>"],
  "assessment": "<string narrative assessment, strictly under 30 words, no emojis>"
}

Ensure your output has NO markdown wrapping. Output ONLY the JSON block.`;

            let responseText = "";

            if (process.env.GROQ_API_KEY) {
                try {
                    responseText = await queryGroq(prompt);
                    success = true;
                } catch (err) {
                    console.warn("Groq failed for cognitive load, trying Gemini...", err.message);
                    lastError = err;
                }
            }

            if (!success && process.env.GEMINI_API_KEY) {
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                for (const modelName of ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"]) {
                    try {
                        const model = genAI.getGenerativeModel({ model: modelName });
                        const result = await model.generateContent(prompt);
                        responseText = result.response.text().trim();
                        success = true;
                        break;
                    } catch (err) {
                        console.warn(`Gemini model ${modelName} failed for cognitive load:`, err.message);
                        lastError = err;
                    }
                }
            }

            if (success) {
                responseText = responseText.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
                try {
                    const parsed = JSON.parse(responseText);
                    resultData = {
                        deliveryProbability: typeof parsed.deliveryProbability === 'number' ? parsed.deliveryProbability : 100,
                        cognitiveLoadScore: typeof parsed.cognitiveLoadScore === 'number' ? parsed.cognitiveLoadScore : 0,
                        detectedDomains: Array.isArray(parsed.detectedDomains) ? parsed.detectedDomains : [],
                        contextSwitchPenalty: typeof parsed.contextSwitchPenalty === 'number' ? parsed.contextSwitchPenalty : 0,
                        deadlinesTimeline,
                        schedulingOverlaps: Array.isArray(parsed.schedulingOverlaps) ? parsed.schedulingOverlaps : [],
                        warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
                        assessment: parsed.assessment || "Analysis computed."
                    };
                } catch (parseError) {
                    console.error("Failed to parse cognitive load AI response, falling back. Raw:", responseText);
                    resultData = calculateLocalCognitiveLoad(user, activeTasks, deadlinesTimeline);
                }
            }
        }

        if (!resultData) {
            resultData = calculateLocalCognitiveLoad(user, activeTasks, deadlinesTimeline);
        }

        // Cache the results on the User document
        user.cognitiveProfile = {
            cognitiveLoadScore: resultData.cognitiveLoadScore,
            deliveryProbability: resultData.deliveryProbability,
            lastUpdated: new Date()
        };
        await user.save();

        return res.json({
            success: true,
            data: {
                developerId: userId,
                ...resultData,
                activeTasksCount: activeTasks.length
            }
        });
    } catch (error) {
        console.error("Cognitive Load Analysis Error:", error);
        return res.status(500).json({
            success: false,
            message: `AI Error: ${error.message}`,
            error: error.message
        });
    }
};

exports.executeNLQuery = async (req, res) => {
    try {
        const { question } = req.body;
        if (!question || typeof question !== 'string' || !question.trim()) {
            return res.status(400).json({ success: false, message: "A search query is required." });
        }

        if (question.length > 500) {
            return res.status(400).json({ success: false, message: "Query length exceeds maximum limit of 500 characters." });
        }

        const companyId = req.user?.companyId;
        if (!companyId) {
            return res.status(400).json({ success: false, message: "User is not associated with a company." });
        }

        const userContext = {
            name: req.user?.name || "Virendra",
            id: req.user?._id ? req.user._id.toString() : "",
            role: req.user?.role || "ceo"
        };

        const prompt = buildNLQueryPrompt(question, userContext);
        const groqResponse = await queryGroqEngine(prompt);

        let parsed = extractJSON(groqResponse);
        if (!parsed) {
            const retryPrompt = `Return ONLY this JSON object with no explanation: {"collection": "tasks" or "users", "pipeline": [ <your MongoDB aggregation stages here> ]}. The question is: "${question}"`;
            const retryResponse = await queryGroqEngine(retryPrompt);
            parsed = extractJSON(retryResponse);
        }

        if (!parsed || !Array.isArray(parsed.pipeline)) {
            return res.status(422).json({ success: false, message: "AI failed to generate a valid database query pipeline." });
        }

        const convertedPipeline = convertToObjectId(parsed.pipeline);

        const validation = validatePipeline(convertedPipeline);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                message: `Security validation failed: ${validation.error}`
            });
        }

        const mongoose = require('mongoose');
        const companyMatch = {
            $match: {
                companyId: new mongoose.Types.ObjectId(companyId)
            }
        };
        
        const safePipeline = [companyMatch, ...convertedPipeline];

        const targetCollection = parsed.collection || "tasks";
        const Model = targetCollection === "users" ? User : Task;

        const startTime = process.hrtime();
        const rawData = await Model.aggregate(safePipeline, { maxTimeMS: 5000 });
        const diff = process.hrtime(startTime);
        const executionTimeMs = Math.round((diff[0] * 1000) + (diff[1] / 1000000));

        const limitedData = rawData.slice(0, 100);

        return res.json({
            success: true,
            rawData: limitedData,
            executionTimeMs,
            resultCount: limitedData.length,
            pipeline: safePipeline,
            question
        });

    } catch (error) {
        console.error("NL Query Controller Error:", error);
        return res.status(500).json({
            success: false,
            message: `AI Query Error: ${error.message}`
        });
    }
};

exports.streamNLAnswer = async (req, res) => {
    try {
        const { question, rawData } = req.body;
        if (!question || !rawData) {
            return res.status(400).json({ success: false, message: "Question and rawData are required." });
        }

        if (!process.env.GROQ_API_KEY_ENGINE) {
            return res.status(500).json({ success: false, message: "GROQ_API_KEY_ENGINE is not configured." });
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.GROQ_API_KEY_ENGINE}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: "You are a professional executive operations assistant. Synthesize and summarize the database query results for the CEO in a concise, high-level Google AI Overview style. Use clean markdown. Do NOT use any emojis under any circumstances. Keep it concise, professional, and enterprise-grade. Use standard markdown bullet points (using asterisks '*') or numbered lists for formatting. Do NOT use plus signs (+) or other non-standard characters as bullet points. Do not mention technical terms like Mongoose, JSON, MongoDB, or pipeline. Speak directly to the business data."
                    },
                    {
                        role: "user",
                        content: `User Question: "${question}"\nDatabase Query Results:\n${JSON.stringify(rawData, null, 2)}`
                    }
                ],
                temperature: 0.2,
                stream: true
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            res.write(`data: ${JSON.stringify({ error: "Groq stream connection failed" })}\n\n`);
            res.write("data: [DONE]\n\n");
            return res.end();
        }

        let buffer = "";
        const processChunk = (chunk) => {
            buffer += chunk;
            const lines = buffer.split("\n");
            buffer = lines.pop();

            for (const line of lines) {
                const cleaned = line.trim();
                if (!cleaned) continue;
                if (cleaned.startsWith("data: [DONE]")) {
                    break;
                }
                if (cleaned.startsWith("data: ")) {
                    try {
                        const jsonStr = cleaned.slice(6);
                        const parsedObj = JSON.parse(jsonStr);
                        const token = parsedObj.choices[0]?.delta?.content || "";
                        if (token) {
                            res.write(`data: ${JSON.stringify({ token })}\n\n`);
                        }
                    } catch (err) {
                        // ignore
                    }
                }
            }
        };

        if (response.body.getReader) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            req.on("close", () => {
                reader.cancel().catch(() => {});
            });
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                processChunk(decoder.decode(value, { stream: true }));
            }
        } else {
            req.on("close", () => {
                response.body.destroy();
            });
            for await (const chunk of response.body) {
                processChunk(chunk.toString());
            }
        }

        res.write("data: [DONE]\n\n");
        res.end();

    } catch (error) {
        console.error("Stream NL Answer Error:", error);
        try {
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.write("data: [DONE]\n\n");
            res.end();
        } catch (e) {
            // ignore
        }
    }
};
