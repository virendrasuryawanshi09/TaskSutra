const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
    text: {type: String, required: true},
    completed: {type: Boolean, default: false},
});

const taskSchema = new mongoose.Schema({
    title: {type: String, required: true},
    description: {type: String},
    priority: {type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium'},
    status: {type: String, enum: ['Pending', 'In-progress', 'Completed'], default: 'Pending'},
    dueDate: {type: Date},
    assignedTo: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    companyId: {type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true},
    attachments: [{type: String}],
    todoChecklist: [todoSchema],
    progress: {type: Number, default: 0},
    taskDna: {
        attributes: {
            type: [String],
            enum: ['Deep-Focus', 'High-Interruption', 'Rapid-Bug-Fix', 'Documentation-Heavy', 'Cross-Functional'],
            default: ['Deep-Focus']
        },
        estimatedComplexityScore: { type: Number, default: 5 } 
    },
  
    domain: {
        type: String,
        enum: ['Frontend', 'Backend', 'Database', 'DevOps', 'QA', 'Design', 'Management', 'Other'],
        default: 'Frontend'
    },

    compassBrief: {
        simplifiedExplanation: { type: String, default: "" },
        businessGoal: { type: String, default: "" },
        receiverExpectations: { type: [String], default: [] },
        difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', ''], default: "" },
        estimatedHours: { type: String, default: "" },
        cachedHash: { type: String, default: "" }
    },
    
    vectorClock: {
        type: Map,
        of: Number,
        default: {}
    }
}, {timestamps: true});

module.exports = mongoose.model("Task", taskSchema);
