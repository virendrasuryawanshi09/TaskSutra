const Task = require('../models/Task');
const User = require('../models/User');
const { getTeamWorkloads } = require('./userController');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Generates an Organizational Health Diagnostic report for the CEO
 * Endpoint: GET /api/ai/org-health
 */
exports.generateOrgHealthReport = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "User is not associated with a company."
            });
        }

        const now = new Date();

        // 1. Gather Telemetry: Completed, Pending, In-progress, and Overdue tasks
        const totalTasks = await Task.countDocuments({ companyId });
        const completedTasksCount = await Task.countDocuments({ companyId, status: 'Completed' });
        const pendingTasksCount = await Task.countDocuments({ companyId, status: 'Pending' });
        const inProgressTasksCount = await Task.countDocuments({ companyId, status: 'In-progress' });

        const overdueTasksCount = await Task.countDocuments({
            companyId,
            status: { $ne: 'Completed' },
            dueDate: { $lt: now }
        });

        // Gather overdue/delayed task details to extract common failure patterns
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

        // 2. Gather team workloads to check for potential burnout
        const teamMembers = await User.find({ companyId, role: 'member' }).select('name title');
        const teamBurnoutMetrics = await Promise.all(teamMembers.map(async (member) => {
            const activeCount = await Task.countDocuments({
                companyId,
                assignedTo: member._id,
                status: { $in: ['Pending', 'In-progress'] }
            });
            const highPriorityCount = await Task.countDocuments({
                companyId,
                assignedTo: member._id,
                status: { $in: ['Pending', 'In-progress'] },
                priority: 'High'
            });
            const overdueCount = await Task.countDocuments({
                companyId,
                assignedTo: member._id,
                status: { $ne: 'Completed' },
                dueDate: { $lt: now }
            });

            return {
                memberName: member.name,
                role: member.title || 'Team Member',
                activeTasks: activeCount,
                highPriorityTasks: highPriorityCount,
                overdueTasks: overdueCount
            };
        }));

        // 3. Validate Gemini API Key configuration
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                success: false,
                message: "Gemini API key is not configured on the server."
            });
        }

        // 4. Initialize Gemini Generative AI SDK
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // 5. Structure context-aware operational analytics prompt
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
Identify the primary weakness causing delays (e.g. key resource bottlenecks, poor task scoping, overdue high priority items) and provide 3 actionable, specific, and realistic steps to overcome it.

You MUST respond strictly in a valid JSON object matching this schema:
{
  "overallHealthScore": <Integer between 0 and 100 representing health score based on completion rate vs overdue task ratios>,
  "primaryWeakness": "<String describing the core bottleneck or weakness causing delays>",
  "growthRecommendations": [
    "<String recommendation 1>",
    "<String recommendation 2>",
    "<String recommendation 3>"
  ]
}

Ensure your output has NO markdown wrapping (like \`\`\`json) or extra text. Output ONLY the JSON block.`;

        // 6. Request reasoning from Gemini
        let result;
        let success = false;
        let lastError = null;
        const modelsToTry = [
            "gemini-2.0-flash",
            "gemini-1.5-flash"
        ];

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent(prompt);
                success = true;
                break;
            } catch (err) {
                console.warn(`Model ${modelName} failed or not found:`, err.message);
                lastError = err;
            }
        }

        if (!success) {
            throw lastError || new Error("All tried Gemini models failed to generate content.");
        }

        let responseText = result.response.text().trim();

        // Strip markdown backticks if returned
        if (responseText.startsWith('```')) {
            responseText = responseText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        }

        let parsedReport;
        try {
            parsedReport = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse Gemini output as JSON. Raw output:", responseText);
            // Fallback response if JSON parsing fails
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

        return res.json({
            success: true,
            data: parsedReport
        });

    } catch (error) {
        console.error("Org Health Diagnostic Error:", error);
        return res.status(500).json({
            success: false,
            message: `AI Error: ${error.message}`,
            error: error.message
        });
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
            return res.status(400).json({
                success: false,
                message: "Task title is required."
            });
        }

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: "User is not associated with a company."
            });
        }

        // 1. Fetch team workloads
        const teamWorkloads = await getTeamWorkloads(companyId);
        if (teamWorkloads.length === 0) {
            return res.json({
                success: true,
                data: []
            });
        }

        // 2. Validate Gemini API Key configuration
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                success: false,
                message: "Groq API key is not configured on the server."
            });
        }

        // 3. Initialize Gemini Generative AI SDK
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // 4. Structure the prompt
        const prompt = `You are a project manager allocating a task to the most compatible team member.
Task details:
Title: "${title}"
Description: "${description || 'No description'}"

Here is the list of candidates with their skills, behavioral traits, and current active task load:
${JSON.stringify(teamWorkloads, null, 2)}

Evaluate compatibility based on:
1. Skills matching (match task requirements semantically against developer skill arrays).
2. Workload balance (penalize developers with higher active tasks to prevent burnout).

You must respond strictly in a valid JSON array matching this schema:
[
  {
    "developerId": "<Developer _id>",
    "score": <Integer between 0 and 100 representing compatibility rating>,
    "matchingSkills": ["<list of matched skills>"],
    "reasoning": "<Short, professional explanation of why this score was assigned>"
  }
]

Ensure your output has NO markdown wrapping (like \`\`\`json) or extra text. Output ONLY the JSON block.`;

        // 5. Query Gemini with fallback models
        let result;
        let success = false;
        let lastError = null;
        const modelsToTry = [
            "gemini-2.0-flash",
            "gemini-1.5-flash"
        ];

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent(prompt);
                success = true;
                break;
            } catch (err) {
                console.warn(`Model ${modelName} failed or not found:`, err.message);
                lastError = err;
            }
        }

        if (!success) {
            throw lastError || new Error("All tried Gemini models failed to generate content.");
        }

        let responseText = result.response.text().trim();

        // Strip markdown backticks if returned
        if (responseText.startsWith('```')) {
            responseText = responseText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        }

        let recommendations;
        try {
            recommendations = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse Gemini task breakdown as JSON. Raw output:", responseText);
            // Fallback response if JSON parsing fails
            recommendations = teamWorkloads.map(w => ({
                developerId: w._id,
                score: w.activeTasks > 4 ? 30 : w.activeTasks > 2 ? 60 : 90,
                matchingSkills: w.skills,
                reasoning: "System fallback allocation based on active task count."
            }));
        }

        // Sort candidates by score descending (highest score at index 0)
        const sortedRecommendations = recommendations.sort((a, b) => b.score - a.score);

        return res.json({
            success: true,
            data: sortedRecommendations
        });

    } catch (error) {
        console.error("Recommend Assignees Error:", error);
        return res.status(500).json({
            success: false,
            message: `AI Error: ${error.message}`,
            error: error.message
        });
    }
};



