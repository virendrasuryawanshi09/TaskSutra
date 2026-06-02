require('dotenv').config();
const mongoose = require('mongoose');

const runDebug = async () => {
  console.log('=== NLQuery Debug Script ===');
  
  // Step 1: Connect DB
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[1] DB connected');

  const Task = require('../models/Task');
  const User = require('../models/User');
  const { validatePipeline } = require('../services/queryValidator');

  // Step 2: Get a real CEO user
  const ceo = await User.findOne({ role: 'ceo' });
  if (!ceo) { console.error('[2] No CEO found!'); process.exit(1); }
  console.log('[2] CEO:', ceo.name, '| companyId:', ceo.companyId);

  // Step 3: Call Groq with a real question
  const question = 'Show me all high priority tasks';
  const companyId = ceo.companyId.toString();

  const prompt = `You are a MongoDB database aggregation pipeline generator.
Translate the user's natural language question into a valid MongoDB aggregation pipeline JSON object for the "tasks" collection.

Your output must be a single JSON object with a "pipeline" key containing the array of aggregation stages.
Example:
{
  "pipeline": [
    { "$match": { "priority": "High" } }
  ]
}

Database Schema Context:
1. "tasks" collection schema fields:
   - _id: ObjectId
   - title: String
   - priority: String (enum: ['Low', 'Medium', 'High'])
   - status: String (enum: ['Pending', 'In-progress', 'Completed'])
   - dueDate: Date
   - assignedTo: Array of ObjectIds
   - companyId: ObjectId
   - domain: String
   - createdAt: Date

Rules:
- The pipeline MUST filter by companyId: "${companyId}"
- Output ONLY the raw aggregation pipeline JSON. Do not include explanation or markdown.
- Return read-only query pipeline stages only.

User Question: "${question}"`;

  console.log('[3] Calling Groq...');
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY_ENGINE}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1
    })
  });

  console.log('[3] Groq status:', response.status);
  if (!response.ok) {
    const err = await response.json();
    console.error('[3] Groq error:', JSON.stringify(err));
    process.exit(1);
  }

  const data = await response.json();
  const raw = (data.choices[0].message.content || '').trim()
    .replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  console.log('[3] Groq response:', raw);

  // Step 4: Parse
  let parsed;
  try {
    parsed = JSON.parse(raw);
    console.log('[4] Parsed OK. Pipeline stages:', JSON.stringify(parsed.pipeline?.map(s => Object.keys(s)[0])));
  } catch (e) {
    console.error('[4] JSON parse failed:', e.message, 'Raw:', raw);
    process.exit(1);
  }

  // Step 5: Validate
  const validation = validatePipeline(parsed.pipeline);
  console.log('[5] Validation:', JSON.stringify(validation));
  if (!validation.valid) {
    console.error('[5] VALIDATION BLOCKED - this is the 500 cause!');
    process.exit(1);
  }

  // Step 6: Execute
  const safePipeline = [
    { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },
    ...parsed.pipeline
  ];
  console.log('[6] Executing pipeline:', JSON.stringify(safePipeline, null, 2));

  try {
    const results = await Task.aggregate(safePipeline, { maxTimeMS: 5000 });
    console.log('[6] Results count:', results.length);
    if (results[0]) console.log('[6] First result:', JSON.stringify(results[0], null, 2));
    console.log('\n=== SUCCESS ===');
  } catch (aggErr) {
    console.error('[6] AGGREGATE ERROR:', aggErr.message);
    console.error('[6] This is the 500 cause!');
  }

  await mongoose.disconnect();
};

runDebug().catch(e => {
  console.error('UNHANDLED:', e.message);
  console.error(e.stack);
  process.exit(1);
});
