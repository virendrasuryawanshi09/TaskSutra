const Task = require('../models/Task');
const User = require('../models/User');
const fs = require('fs');
const { getTeamWorkloads } = require('./userController');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Helper to query Groq Completions API
 */
const queryGroq = async (prompt) => {
    if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is not configured.");
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.1
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Groq API returned status ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
};

/**
 * Local fallback matching when AI APIs fail
 */
const calculateLocalRecommendations = (teamWorkloads, title, description) => {
    const textToMatch = `${title} ${description || ""}`.toLowerCase();

    return teamWorkloads.map(w => {
        const matchingSkills = [];
        if (Array.isArray(w.skills)) {
            w.skills.forEach(skill => {
                if (skill && textToMatch.includes(skill.toLowerCase())) {
                    matchingSkills.push(skill);
                }
            });
        }

        // Base score starts at 60
        let score = 60;
        // Add 15 points per matched skill, capped at +30
        score += Math.min(30, matchingSkills.length * 15);
        // Deduct 10 points per active task, capped at -40
        const activeCount = w.activeTasks || 0;
        score -= Math.min(40, activeCount * 10);
        // Clamp between 15 and 95
        score = Math.max(15, Math.min(95, score));

        const reasoning = matchingSkills.length > 0
            ? `Matched skill(s) [${matchingSkills.join(", ")}] with ${activeCount} active task(s).`
            : `Matched on active workload of ${activeCount} task(s).`;

        return {
            developerId: w._id.toString(),
            score,
            matchingSkills,
            reasoning
        };
    });
};

/**
 * Mathematical rule-based local fallback cognitive load calculator
 */
const calculateLocalCognitiveLoad = (user, activeTasks, deadlinesTimeline) => {
    const now = new Date();
    let deliveryProbability = 100;
    let cognitiveLoadScore = 0;
    const warnings = [];
    const schedulingOverlaps = [];
    
    // 1. Analyze domains for context-switching
    const domains = new Set();
    activeTasks.forEach(t => {
        if (t.domain) {
            domains.add(t.domain);
        } else {
            domains.add("Frontend"); // default fallback
        }
    });
    
    const detectedDomains = Array.from(domains);
    const domainCount = detectedDomains.length;
    const contextSwitchPenalty = Math.max(0, (domainCount - 1) * 10);
    deliveryProbability -= contextSwitchPenalty;
    
    if (contextSwitchPenalty > 0) {
        warnings.push(`Context-switching penalty applied for working across ${domainCount} domains.`);
    }

    // 2. Analyze tasks, priorities, and complexity
    activeTasks.forEach(task => {
        let taskPenalty = 0;
        const complexity = task.taskDna?.estimatedComplexityScore || 5;
        
        // Base load contribution from complexity
        cognitiveLoadScore += complexity * 6; // max 60
        
        // Priority weight
        if (task.priority === 'High') {
            cognitiveLoadScore += 15;
            taskPenalty += 12;
        } else if (task.priority === 'Medium') {
            cognitiveLoadScore += 8;
            taskPenalty += 6;
        } else {
            cognitiveLoadScore += 3;
            taskPenalty += 2;
        }
        
        // Check if overdue
        if (task.dueDate && new Date(task.dueDate) < now) {
            taskPenalty += 15;
            warnings.push(`Task "${task.title}" is overdue.`);
        }
        
        deliveryProbability -= taskPenalty;
    });

    // 3. Analyze scheduling overlaps (deadlines within 48 hours of each other)
    for (let i = 0; i < deadlinesTimeline.length; i++) {
        for (let j = i + 1; j < deadlinesTimeline.length; j++) {
            if (!deadlinesTimeline[i].dueDate || !deadlinesTimeline[j].dueDate) continue;
            const date1 = new Date(deadlinesTimeline[i].dueDate);
            const date2 = new Date(deadlinesTimeline[j].dueDate);
            const diffTime = Math.abs(date2 - date1);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays <= 2) {
                const overlapDesc = `Deadline collision: "${deadlinesTimeline[i].title}" and "${deadlinesTimeline[j].title}" are due within ${diffDays} day(s) of each other.`;
                schedulingOverlaps.push({ description: overlapDesc });
                deliveryProbability -= 10;
                cognitiveLoadScore += 8;
                warnings.push(`Timeline collision on tasks due near ${new Date(deadlinesTimeline[i].dueDate).toLocaleDateString()}.`);
            }
        }
    }

    // 4. Integrate user metrics
    const lateRate = user.behavioralProfile?.performanceMetrics?.lateSubmissionRate || 0;
    deliveryProbability -= Math.round(lateRate * 0.4);

    // 5. Clamping
    deliveryProbability = Math.max(10, Math.min(98, deliveryProbability));
    cognitiveLoadScore = Math.max(5, Math.min(95, cognitiveLoadScore));

    // Compile assessment
    let assessment = "";
    if (cognitiveLoadScore > 75) {
        assessment = `Critical cognitive load with high risk of delivery delays. Needs workload rebalancing immediately.`;
    } else if (cognitiveLoadScore > 40) {
        assessment = `Moderate load. Multi-tasking across ${domainCount} domains requires careful deadline monitoring.`;
    } else {
        assessment = `Optimal capacity. Workload is well-distributed and deadlines are clear.`;
    }

    return {
        deliveryProbability,
        cognitiveLoadScore,
        detectedDomains,
        contextSwitchPenalty,
        deadlinesTimeline,
        schedulingOverlaps,
        warnings,
        assessment
    };
};

/**
 * Generates an Organizational Health Diagnostic report for the CEO
 * Endpoint: GET /api/ai/org-health
 */
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

/**
 * Recommends and ranks team members for a task based on skills and workloads
 * Endpoint: POST /api/ai/recommend-assignees
 */
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

// Moved to top of file

/**
 * Evaluates and analyzes a team member's cognitive load and delivery probability
 * Endpoint: GET /api/ai/cognitive-load/:userId
 */
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

/**
 * Execute Natural Language Query (Phase 1 Stub)
 * Endpoint: POST /api/ai/ceo/nl-query
 */
exports.executeNLQuery = async (req, res) => {
    return res.status(501).json({ success: false, message: "Not Implemented" });
};

/**
 * Stream Natural Language Query Answer (Phase 2 Stub)
 * Endpoint: POST /api/ai/ceo/nl-query/stream
 */
exports.streamNLAnswer = async (req, res) => {
    return res.status(501).json({ success: false, message: "Not Implemented" });
};
