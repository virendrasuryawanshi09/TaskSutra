const Task = require('../models/Task');
const crypto = require('crypto');


exports.decodeTaskBriefing = async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ success: false, message: "Task not found." });
        }

        if (String(task.companyId || '') !== String(req.user.companyId || '')) {
            return res.status(403).json({ success: false, message: "Not authorized to access this task." });
        }

        const title = task.title || "";
        const description = task.description || "";

        // Calculate MD5 hash of title and description to check cache integrity
        const hashInput = `${title}_${description}`;
        const currentHash = crypto.createHash('md5').update(hashInput).digest('hex');

        // Check cache
        if (task.compassBrief && task.compassBrief.cachedHash === currentHash && task.compassBrief.simplifiedExplanation) {
            return res.json({ success: true, data: task.compassBrief });
        }

        // Prompt tailored for user design requirement: bolding important items, no emojis
        const prompt = `You are an AI Product Analyst and Task Orchestrator. Help the developer understand their assigned task.
Task Title: "${title}"
Task Description: "${description}"

Provide a detailed briefing structure. You must use markdown bolding (**) for all key deliverables, numbers, timelines, and critical requirements to maximize legibility. Do NOT include any emojis or icons.

Your response must be a valid JSON object matching the following schema exactly:
{
  "simplifiedExplanation": "A beginner-friendly, detailed explanation. Bold important goals or concepts.",
  "businessGoal": "Explain the business purpose and why this task is crucial. Bold important outcomes.",
  "receiverExpectations": [
    "A clear sentence explaining exactly what the manager/receiver expects to be delivered or submitted to get this task approved. Bold critical outcomes."
  ],
  "difficulty": "Beginner|Intermediate|Advanced",
  "estimatedHours": "A range of estimated hours, e.g., **4-6** hours. Bold the numbers."
}

Ensure your output has NO markdown wrapping. Output ONLY the JSON block.`;

        let responseText = "";
        let success = false;
        let lastError = null;

        // Try Groq with the user's custom API key (GROQ_API_KEY_USER) first
        if (process.env.GROQ_API_KEY_USER) {
            try {
                const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.GROQ_API_KEY_USER}`
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [{ role: "user", content: prompt }],
                        temperature: 0.1
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    responseText = (data.choices[0].message.content || "").trim();
                    success = true;
                } else {
                    const errText = await response.text();
                    console.warn("Groq User Key API error, falling back:", errText);
                }
            } catch (err) {
                console.warn("Groq User Key connection failed:", err.message);
                lastError = err;
            }
        }

        // Try Gemini if Groq fails or user key is not configured
        if (!success && process.env.GEMINI_API_KEY) {
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            for (const modelName of ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"]) {
                try {
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent(prompt);
                    responseText = result.response.text().trim();
                    success = true;
                    break;
                } catch (err) {
                    console.warn(`Gemini model ${modelName} failed for decode:`, err.message);
                    lastError = err;
                }
            }
        }

        if (!success) {
            throw lastError || new Error("All AI services failed.");
        }

        // Parse JSON output
        responseText = responseText.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();
        let parsedBrief;
        try {
            parsedBrief = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse AI briefing response, using fallback formatting. Raw:", responseText);
            parsedBrief = {
                simplifiedExplanation: `Please implement the task: **${title}**. Detailed explanation failed to parse.`,
                businessGoal: "Improve the overall system stability and feature robustness.",
                receiverExpectations: ["Complete the task as defined in the title and description."],
                difficulty: "Intermediate",
                estimatedHours: "**4-8** hours"
            };
        }

        // Build sanitised cached object
        const compassBrief = {
            simplifiedExplanation: parsedBrief.simplifiedExplanation || "",
            businessGoal: parsedBrief.businessGoal || "",
            receiverExpectations: Array.isArray(parsedBrief.receiverExpectations) ? parsedBrief.receiverExpectations : [],
            difficulty: ['Beginner', 'Intermediate', 'Advanced'].includes(parsedBrief.difficulty) ? parsedBrief.difficulty : 'Intermediate',
            estimatedHours: parsedBrief.estimatedHours || "",
            cachedHash: currentHash
        };

        // Cache result in Task document
        task.compassBrief = compassBrief;
        await task.save();

        return res.json({ success: true, data: compassBrief });

    } catch (error) {
        console.error("Decode Task Briefing Error:", error);
        return res.status(500).json({
            success: false,
            message: `AI Error: ${error.message}`,
            error: error.message
        });
    }
};
