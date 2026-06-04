const mongoose = require("mongoose");

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
            temperature: 0.1
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Groq API returned status ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices[0].message.content || "";
    return raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
};

const queryGroqEngine = async (prompt) => {
    if (!process.env.GROQ_API_KEY_ENGINE) {
        throw new Error("GROQ_API_KEY_ENGINE is not configured.");
    }

    const body = {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1
    };

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.GROQ_API_KEY_ENGINE}`
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Groq Engine API returned status ${response.status}`);
    }

    const data = await response.json();
    const raw = data.choices[0].message.content || "";
    return raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
};

const extractJSON = (text) => {
    if (!text) return null;
    let cleaned = text.trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
    try { return JSON.parse(cleaned); } catch (_) {}
    const start = cleaned.indexOf('{');
    if (start === -1) return null;
    let depth = 0;
    for (let i = start; i < cleaned.length; i++) {
        if (cleaned[i] === '{') depth++;
        else if (cleaned[i] === '}') {
            depth--;
            if (depth === 0) {
                try { return JSON.parse(cleaned.slice(start, i + 1)); } catch (_) { return null; }
            }
        }
    }
    return null;
};

const convertToObjectId = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => convertToObjectId(item));
    }

    const newObj = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const val = obj[key];
            if (typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val)) {
                newObj[key] = new mongoose.Types.ObjectId(val);
            } else if (typeof val === 'object' && val !== null) {
                newObj[key] = convertToObjectId(val);
            } else {
                newObj[key] = val;
            }
        }
    }
    return newObj;
};

const buildNLQueryPrompt = (question, userContext) => {
    return `You are a MongoDB aggregation pipeline generator for a task management system.
Your ONLY output must be a single JSON object with "collection" and "pipeline" keys. No explanation, no markdown, no extra text.

Output format:
{
  "collection": "tasks" or "users",
  "pipeline": [ <stages here> ]
}

Target Collection Rule:
- Use "users" if the question asks about users, developers, team members, staff, assignees, or workspace people (e.g. counting users, listing skills of developers, finding roles).
- Use "tasks" for all other queries (e.g. listing tasks, counting tasks, task status, due dates).

Task collection fields:
- title: String
- priority: String ("Low", "Medium", "High")
- status: String ("Pending", "In-progress", "Completed")
- dueDate: Date
- assignedTo: Array of ObjectIds (ref: users)
- createdBy: ObjectId (ref: users)
- todoChecklist: [{text: String, completed: Boolean}]
- progress: Number (0-100)
- domain: String ("Frontend","Backend","Database","DevOps","QA","Design","Management","Other")
- taskDna: {attributes:[String], estimatedComplexityScore: Number}
- createdAt: Date

Users collection fields:
- name: String
- role: String ("ceo","admin","member")
- skills: [String] (e.g. ["React", "Node.js"])
- title: String

User Context:
- The logged-in user who is asking the question:
  - Name: "${userContext.name}"
  - User ID: "${userContext.id}"
  - Role: "${userContext.role}"

Rules:
- DO NOT include companyId in your pipeline. It is injected automatically.
- DO NOT use $out, $merge, $function, $accumulator.
- Return read-only stages only.
- When querying "users" for developers/staff/team, include both "member" and "admin" roles (do not restrict only to "member" unless specifically asked).
- DO NOT unwind simple arrays of strings like "skills" or "attributes". Match them natively (e.g. {"skills": "React"}). Unwinding simple arrays or performing lookup/unwind on tasks for user queries causes duplicates and is strictly forbidden.
- When the user asks for "my tasks", "tasks assigned to me", or "tasks I created", filter by assignedTo containing "${userContext.id}" or createdBy equal to "${userContext.id}". Use the 24-character hexadecimal string format for user IDs.
- If you use a $project stage, you MUST include/preserve the following display fields so the UI can render cards properly:
  - For "users": "name", "role", "title", "skills"
  - For "tasks": "title", "description", "status", "priority", "dueDate", "progress", "assignedTo"
  - Ensure any lookup or computed field is added/retained along with these display fields.

User question: "${question}"`;
};

module.exports = {
    queryGroq,
    queryGroqEngine,
    extractJSON,
    convertToObjectId,
    buildNLQueryPrompt
};
