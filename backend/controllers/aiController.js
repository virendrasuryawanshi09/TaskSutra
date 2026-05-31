const Task = require('../models/Task');
const User = require('../models/User');

/**
 * Helper function to call Groq Chat Completion API using native fetch
 */
const callGroqAPI = async (prompt, systemInstruction = "") => {
    const modelsToTry = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant"
    ];

    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: [
                        ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.1,
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || `Groq API status ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (err) {
            console.warn(`Groq model ${modelName} failed:`, err.message);
            lastError = err;
        }
    }

    throw lastError || new Error("All tried Groq models failed to generate content.");
};

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

        // 3. Validate Groq API Key configuration
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({
                success: false,
                message: "Groq API key is not configured on the server."
            });
        }

        // 4. Structure context-aware operational analytics prompt
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

        const systemInstruction = "You are an expert Chief Operations Officer (COO) and organization analyst. Respond strictly in a valid JSON object matching the requested schema. Do not add markdown codeblocks, just return the JSON object.";

        // 5. Request diagnostic from Groq
        const responseText = await callGroqAPI(prompt, systemInstruction);

        let parsedReport;
        try {
            parsedReport = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse Groq output as JSON. Raw output:", responseText);
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
 * Generates an automated task checklist breakdown and time estimations
 * Endpoint: POST /api/ai/breakdown
 */
exports.generateTaskBreakdown = async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: "Task title is required."
            });
        }

        // Validate Groq API Key configuration
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({
                success: false,
                message: "Groq API key is not configured on the server."
            });
        }

        // Design the breakdown prompt
        const prompt = `You are an expert product manager and technical coordinator.
Analyze this high-level task:
Title: "${title}"
Description: "${description || 'No description provided'}"

Generate a list of 4 to 7 actionable, granular sub-tasks to complete this task. For each sub-task, assign a realistic completion estimate in hours (e.g. 1, 2, 4 hours).
Respond strictly in a valid JSON object matching this schema:
{
  "totalEstimatedHours": <Integer representing sum of all estHours>,
  "checklist": [
    {
      "subTask": "<String describing the concrete actionable sub-task>",
      "estHours": <Integer representing estimated hours to complete>
    }
  ]
}

Ensure your output has NO markdown wrapping (like \`\`\`json) or extra text. Output ONLY the JSON block.`;

        const systemInstruction = "You are an expert product manager and technical coordinator. Respond strictly in a valid JSON object matching the requested schema. Do not add markdown codeblocks, just return the JSON object.";

        // Request content generation from Groq
        const responseText = await callGroqAPI(prompt, systemInstruction);

        let parsedBreakdown;
        try {
            parsedBreakdown = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse Groq task breakdown as JSON. Raw output:", responseText);
            // Fallback response if JSON parsing fails
            parsedBreakdown = {
                totalEstimatedHours: 6,
                checklist: [
                    { subTask: "Requirement scoping & analysis", estHours: 1 },
                    { subTask: "Core implementation", estHours: 4 },
                    { subTask: "Testing and verification", estHours: 1 }
                ]
            };
        }

        return res.json({
            success: true,
            data: parsedBreakdown
        });

    } catch (error) {
        console.error("Task Breakdown Error:", error);
        return res.status(500).json({
            success: false,
            message: `AI Error: ${error.message}`,
            error: error.message
        });
    }
};
