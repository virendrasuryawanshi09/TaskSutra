const Task = require('../models/Task');
const User = require('../models/User');
const fs = require('fs');
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
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
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
 * Local fallback matching calculation when AI APIs are unreachable or fail
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
        
        // Clamp score between 15 and 95
        score = Math.max(15, Math.min(95, score));
        
        let reasoning = "";
        if (matchingSkills.length > 0) {
            reasoning = `Matched skill(s) [${matchingSkills.join(", ")}] with an active workload of ${activeCount} task(s). (Fallback Match)`;
        } else {
            reasoning = `Allocated based on active workload of ${activeCount} task(s). (Fallback Match)`;
        }
        
        return {
            developerId: w._id.toString(),
            score,
            matchingSkills,
            reasoning
        };
    });
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

        // 2. Structure the prompt (asking for a JSON object containing the recommendations list)
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
      "score": <Integer between 0 and 100 representing compatibility rating>,
      "matchingSkills": ["<list of matched skills>"],
      "reasoning": "<Short, professional explanation of why this score was assigned>"
    }
  ]
}

Ensure your output has NO markdown wrapping (like \`\`\`json) or extra text. Output ONLY the JSON block.`;

        // 3. Request completions from Groq or Gemini
        let responseText = "";
        let success = false;
        let lastError = null;
        let groqError = null;

        // Try Groq first if key exists
        if (process.env.GROQ_API_KEY) {
            try {
                responseText = await queryGroq(prompt);
                success = true;
            } catch (err) {
                console.warn("Groq query failed, trying Gemini...", err.message);
                groqError = err;
            }
        }

        // Fallback to Gemini if Groq fails or key is missing
        if (!success) {
            if (process.env.GEMINI_API_KEY) {
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const modelsToTry = [
                    "gemini-2.0-flash",
                    "gemini-1.5-flash",
                    "gemini-1.5-flash-latest",
                    "gemini-1.5-pro",
                    "gemini-pro"
                ];

                for (const modelName of modelsToTry) {
                    try {
                        const model = genAI.getGenerativeModel({ model: modelName });
                        const result = await model.generateContent(prompt);
                        responseText = result.response.text().trim();
                        success = true;
                        break;
                    } catch (err) {
                        console.warn(`Model ${modelName} failed or not found:`, err.message);
                        lastError = err;
                    }
                }
            }
        }

        let recommendations = [];

        if (!success) {
            const errMsg = groqError 
                ? `Groq failed (${groqError.message}) and Gemini failed (${lastError ? lastError.message : "unknown/disabled"})`
                : `Gemini failed: ${lastError ? lastError.message : "unknown/disabled"}`;
            
            console.error("All AI services failed, falling back to local workload-matching logic. Details:", errMsg);
            
            // Log the error for local debugging
            try {
                fs.writeFileSync('C:\\TaskSutra\\backend_error.log', `AI Services Failed:\n${errMsg}\n`);
            } catch (fsErr) {
                console.error("Failed to write error log file:", fsErr);
            }

            recommendations = calculateLocalRecommendations(teamWorkloads, title, description);
        } else {
            responseText = responseText.trim();

            // Strip markdown backticks if returned
            if (responseText.startsWith('```')) {
                responseText = responseText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
            }

            try {
                const parsed = JSON.parse(responseText);
                if (parsed && Array.isArray(parsed.recommendations)) {
                    recommendations = parsed.recommendations;
                } else if (Array.isArray(parsed)) {
                    recommendations = parsed;
                } else {
                    throw new Error("Invalid structure returned by AI model: " + responseText.substring(0, 100));
                }
            } catch (parseError) {
                console.error("Failed to parse AI recommendations as JSON. Raw output:", responseText, parseError);
                recommendations = calculateLocalRecommendations(teamWorkloads, title, description);
            }
        }

        // Enrich recommendations with user details
        const enrichedRecommendations = recommendations.map(rec => {
            const devInfo = teamWorkloads.find(w => w._id.toString() === rec.developerId.toString());
            return {
                ...rec,
                name: devInfo ? devInfo.name : "Unknown",
                title: devInfo ? devInfo.title : "Team Member",
                activeTasks: devInfo ? devInfo.activeTasks : 0
            };
        });

        // Sort candidates by score descending (highest score at index 0)
        const sortedRecommendations = enrichedRecommendations.sort((a, b) => b.score - a.score);

        return res.json({
            success: true,
            data: sortedRecommendations
        });

    } catch (error) {
        console.error("Recommend Assignees Error:", error);
        try {
            fs.writeFileSync('C:\\TaskSutra\\backend_error.log', `Error Message: ${error.message}\nStack Trace:\n${error.stack}\n`);
        } catch (fsErr) {
            console.error("Failed to write error log file:", fsErr);
        }
        return res.status(500).json({
            success: false,
            message: `AI Error: ${error.message}`,
            error: error.message
        });
    }
};



