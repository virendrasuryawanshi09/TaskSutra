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

        // 4. Enrich with user details
        const enrichedRecommendations = recommendations.map(rec => {
            const devInfo = teamWorkloads.find(w => w._id.toString() === rec.developerId.toString());
            return {
                ...rec,
                name: devInfo ? devInfo.name : "Unknown",
                title: devInfo ? devInfo.title : "Team Member",
                activeTasks: devInfo ? devInfo.activeTasks : 0
            };
        });

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

        // Stub response for Commit 1 architecture verification
        return res.json({
            success: true,
            data: {
                developerId: userId,
                deliveryProbability: 100,
                cognitiveLoadScore: 0,
                activeTasksCount: 0,
                detectedDomains: [],
                contextSwitchPenalty: 0,
                deadlinesTimeline: [],
                schedulingOverlaps: [],
                warnings: [],
                assessment: "Initial architectural setup. Analysis stub."
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
