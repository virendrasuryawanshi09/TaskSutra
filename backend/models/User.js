const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        profileImageUrl: { type: String, default: null },
        role: { type: String, enum: ['admin', 'member'], default: 'member' },
        skills: { type: [String], default: [] },
        bio: { type: String, default: '' },
        title: { type: String, default: '' },
        company: { type: String, default: '' },
        companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
        status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
