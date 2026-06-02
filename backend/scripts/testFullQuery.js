require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('../models/Task');
const { validatePipeline } = require('../services/queryValidator');

// Simulate the full executeNLQuery flow without HTTP
const runFullTest = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('DB connected');

  // Simulate what Groq would return for a typical query
  const simulatedGroqOutput = JSON.stringify({
    pipeline: [
      { $match: { priority: 'High' } },
      { $addFields: { totalChecklist: { $size: { $ifNull: ['$todoChecklist', []] } } } },
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      { $project: { title: 1, priority: 1, status: 1, dueDate: 1, totalChecklist: 1 } }
    ]
  });

  const parsed = JSON.parse(simulatedGroqOutput);
  
  const validation = validatePipeline(parsed.pipeline);
  console.log('Validation result:', JSON.stringify(validation));
  
  if (!validation.valid) {
    console.error('VALIDATION FAILED:', validation.error);
    await mongoose.disconnect();
    return;
  }

  // Get first company from DB
  const User = require('../models/User');
  const ceo = await User.findOne({ role: 'ceo' });
  if (!ceo) {
    console.error('No CEO found in DB. Cannot test company scoping.');
    await mongoose.disconnect();
    return;
  }
  console.log('Using CEO companyId:', ceo.companyId);

  const companyMatch = {
    $match: { companyId: new mongoose.Types.ObjectId(ceo.companyId) }
  };
  const safePipeline = [companyMatch, ...parsed.pipeline];
  
  const results = await Task.aggregate(safePipeline, { maxTimeMS: 5000 });
  console.log(`Query returned ${results.length} results`);
  if (results.length > 0) console.log('First result:', JSON.stringify(results[0], null, 2));
  console.log('SUCCESS - Full pipeline works!');

  await mongoose.disconnect();
};

runFullTest().catch(e => { console.error('FULL TEST FAILED:', e.message); process.exit(1); });
