const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        profileImageUrl: { type: String, default: null },
        role: { type: String, enum: ['ceo', 'admin', 'member'], default: 'member' },
        skills: { type: [String], default: [] },
        bio: { type: String, default: '' },
        title: { type: String, default: '' },
        company: { type: String, default: '' },
        // AI Pillar 4: Work Personality Profile
        behavioralProfile: {
            traits: { 
                type: [String], 
                enum: ['Deep-Focus', 'Hyper-Speed Debugger', 'Architect', 'Stabilizer', 'High-Pressure Delivery'],
                default: ['Deep-Focus'] 
            },
            performanceMetrics: {
                avgChecklistCompletionTime: { type: Number, default: 0 }, 
                lateSubmissionRate: { type: Number, default: 0 }, 
                reviewAccuracyRate: { type: Number, default: 100 }
            }
        },
        // AI Feature 2: Cognitive Load & Delivery Probability Cache
        cognitiveProfile: {
            cognitiveLoadScore: { type: Number, default: 0 },
            deliveryProbability: { type: Number, default: 100 },
            lastUpdated: { type: Date, default: null }
        },
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
        status: { type: String, enum: ['active', 'suspended'], default: 'active' },
        taskOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: [] }],
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
