const { validatePipeline } = require('../services/queryValidator');

// Typical AI-generated pipelines
const tests = [
  {
    name: "With $addFields",
    pipeline: [
      { $match: { priority: 'High' } },
      { $addFields: { assigneeName: { $arrayElemAt: ['$assigneeDetails.name', 0] } } },
    ]
  },
  {
    name: "With $set",
    pipeline: [
      { $match: { status: 'Pending' } },
      { $set: { computed: true } }
    ]
  },
  {
    name: "With $replaceRoot",
    pipeline: [
      { $match: {} },
      { $replaceRoot: { newRoot: '$someField' } }
    ]
  },
  {
    name: "With $skip",
    pipeline: [
      { $match: {} },
      { $skip: 5 }
    ]
  },
  {
    name: "Normal valid pipeline",
    pipeline: [
      { $match: { priority: 'High' } },
      { $lookup: { from: 'users', localField: 'assignedTo', foreignField: '_id', as: 'assigneeDetails' } },
      { $sort: { createdAt: -1 } },
      { $limit: 10 }
    ]
  }
];

tests.forEach(t => {
  const result = validatePipeline(t.pipeline);
  console.log(`${t.name}: valid=${result.valid}${result.error ? ' | error=' + result.error : ''}`);
});
