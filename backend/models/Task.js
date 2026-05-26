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
    // AI Pillar 4: Task DNA Attributes
    taskDna: {
        attributes: {
            type: [String],
            enum: ['Deep-Focus', 'High-Interruption', 'Rapid-Bug-Fix', 'Documentation-Heavy', 'Cross-Functional'],
            default: ['Deep-Focus']
        },
        estimatedComplexityScore: { type: Number, default: 5 } // 1-10 scale
    }
}, {timestamps: true});

module.exports = mongoose.model("Task", taskSchema);
