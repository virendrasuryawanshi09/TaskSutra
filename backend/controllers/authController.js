const User = require('../models/User');
const Company = require('../models/Company');
const Invitation = require('../models/Invitation');
const Task = require('../models/Task');
const DirectChat = require('../models/DirectChat');
const DirectMessage = require('../models/DirectMessage');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const TaskDiscussion = require('../models/TaskDiscussion');
const TaskMessage = require('../models/TaskMessage');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//Generate JWT
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const registerUser = async (req, res) => {
    try {
        const { name, email, password, profileImageUrl, inviteToken } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const role = "member";

        let companyId = null;
        let companyName = "";

        if (inviteToken) {
            const invitation = await Invitation.findOne({ token: inviteToken }).populate("companyId");
            if (!invitation || invitation.status !== "pending" || new Date() > invitation.expiresAt) {
                return res.status(400).json({ message: "Invitation token has expired or is invalid" });
            }
            if (invitation.email.toLowerCase() !== email.toLowerCase()) {
                return res.status(400).json({ message: "Invitation email does not match registering email" });
            }

            companyId = invitation.companyId?._id || null;
            companyName = invitation.companyId?.name || "";

            // Mark invitation as accepted
            invitation.status = "accepted";
            await invitation.save();
        } else {

        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            profileImageUrl,
            role,
            companyId,
            company: companyName,
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImageUrl: user.profileImageUrl,
            skills: user.skills || [],
            bio: user.bio || "",
            title: user.title || "",
            company: user.company || "",
            createdAt: user.createdAt,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImageUrl: user.profileImageUrl,
            skills: user.skills || [],
            bio: user.bio || "",
            title: user.title || "",
            company: user.company || "",
            createdAt: user.createdAt,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.name = req.body.name || user.name;
        if (req.body.email && req.body.email !== user.email) {
            const emailTaken = await User.findOne({ email: req.body.email, _id: { $ne: user._id } });
            if (emailTaken) {
                return res.status(400).json({ message: 'Email is already in use by another account' });
            }
            user.email = req.body.email;
        }
        user.profileImageUrl = req.body.profileImageUrl !== undefined ? req.body.profileImageUrl : user.profileImageUrl;
        user.skills = req.body.skills || user.skills;
        user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
        user.title = req.body.title !== undefined ? req.body.title : user.title;
        user.company = req.body.company !== undefined ? req.body.company : user.company;

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            profileImageUrl: updatedUser.profileImageUrl ?? null,
            skills: updatedUser.skills,
            bio: updatedUser.bio,
            title: updatedUser.title,
            company: updatedUser.company,
            createdAt: updatedUser.createdAt,
            token: generateToken(updatedUser._id),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const mongoose = require('mongoose');

const executeDeleteOperations = async (user, session) => {
    const userId = user._id;
    const sessionOpt = session ? { session } : {};

    
    if (user.role === 'ceo' && user.companyId) {
        const companyId = user.companyId;

        const companyTasks = await Task.find({ companyId }, null, sessionOpt).select('_id');
        const companyTaskIds = companyTasks.map(t => t._id);
        if (companyTaskIds.length > 0) {
            const discussions = await TaskDiscussion.find({ task: { $in: companyTaskIds } }, null, sessionOpt);
            const discussionIds = discussions.map(d => d._id);
            if (discussionIds.length > 0) {
                await TaskMessage.deleteMany({ discussionId: { $in: discussionIds } }, sessionOpt);
                await TaskDiscussion.deleteMany({ _id: { $in: discussionIds } }, sessionOpt);
            }
        }

       
        await Company.findByIdAndDelete(companyId, sessionOpt);
        await Task.deleteMany({ companyId }, sessionOpt);
        await Invitation.deleteMany({ companyId }, sessionOpt);
        await Notification.deleteMany({ companyId }, sessionOpt);
        await Message.deleteMany({ companyId }, sessionOpt);

        
        await User.updateMany({ companyId }, { $set: { companyId: null, company: "" } }, sessionOpt);
    }


    const directChats = await DirectChat.find({ participants: userId }, null, sessionOpt);
    const directChatIds = directChats.map(chat => chat._id);
    if (directChatIds.length > 0) {
        await DirectMessage.deleteMany({ chatId: { $in: directChatIds } }, sessionOpt);
        await DirectChat.deleteMany({ _id: { $in: directChatIds } }, sessionOpt);
    }


    await Message.deleteMany({ sender: userId }, sessionOpt);

   
    await Task.updateMany({ assignedTo: userId }, { $pull: { assignedTo: userId } }, sessionOpt);
    await Task.updateMany({ createdBy: userId }, { $set: { createdBy: null } }, sessionOpt);

   
    await TaskMessage.deleteMany({ sender: userId }, sessionOpt);
    await TaskDiscussion.updateMany({ participants: userId }, { $pull: { participants: userId } }, sessionOpt);


    await Notification.deleteMany({ $or: [{ recipient: userId }, { sender: userId }] }, sessionOpt);

  
    await User.findByIdAndDelete(userId, sessionOpt);
};

const deleteAccount = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const session = await mongoose.startSession();
        try {
            await session.withTransaction(async () => {
                await executeDeleteOperations(user, session);
            });
            res.json({ message: 'Account and all associated data deleted successfully (transactional)' });
        } catch (txError) {
           
            const isStandaloneErr = txError.message.includes("Transaction numbers are only allowed on a replica set") ||
                                    txError.code === 251 ||
                                    txError.codeName === "TransactionSystemFailed";

            if (isStandaloneErr) {
                console.warn("MongoDB replica set not detected. Running deleteAccount non-transactionally as fallback.");
                await executeDeleteOperations(user, null);
                res.json({ message: 'Account and all associated data deleted successfully' });
            } else {
                throw txError;
            }
        } finally {
            session.endSession();
        }
    } catch (error) {
        console.error("Delete Account Error:", error);
        res.status(500).json({ message: 'Server error during account deletion', error: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    deleteAccount,
};