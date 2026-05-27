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
    try{
        const { name, email, password, profileImageUrl, adminInviteToken, inviteToken } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        let role = "member";
        if (adminInviteToken && adminInviteToken === process.env.ADMIN_INVITE_TOKEN) {
            role = "admin";
        }

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
            // Auto-join via domain check fallback
            const emailDomain = email.split('@')[1]?.toLowerCase();
            const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'zoho.com', 'protonmail.com', 'mail.com'];
            if (emailDomain && !publicDomains.includes(emailDomain)) {
                const matchingCompany = await Company.findOne({ domain: emailDomain, isVerified: true });
                if (matchingCompany) {
                    companyId = matchingCompany._id;
                    companyName = matchingCompany.name;
                }
            }
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
    }catch(error){
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const loginUser = async (req, res) => {
    try{
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if(!user){
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
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
    }catch(error){
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getUserProfile = async (req, res) => {
    try{
        const user = await User.findById(req.user._id).select('-password');
        if(user){
            res.json(user);
        }else{
            res.status(404).json({ message: 'User not found' });
        }
    }catch(error){
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateUserProfile = async (req, res) => {
    try{
        const user = await User.findById(req.user._id); 
        if(!user) {
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

        if(req.body.password){
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
    }catch(error){
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteAccount = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // 1. Clean up Direct Chats & Direct Messages
        const directChats = await DirectChat.find({ participants: userId });
        const directChatIds = directChats.map(chat => chat._id);
        if (directChatIds.length > 0) {
            await DirectMessage.deleteMany({ chatId: { $in: directChatIds } });
            await DirectChat.deleteMany({ _id: { $in: directChatIds } });
        }

        // 2. Clean up General/Company Messages
        await Message.deleteMany({ sender: userId });

        // 3. Clean up Tasks (pull from assignedTo, set createdBy to null)
        await Task.updateMany({ assignedTo: userId }, { $pull: { assignedTo: userId } });
        await Task.updateMany({ createdBy: userId }, { $set: { createdBy: null } });

        // 4. Clean up Task Discussion Messages and pull user from discussion participants
        await TaskMessage.deleteMany({ sender: userId });
        await TaskDiscussion.updateMany({ participants: userId }, { $pull: { participants: userId } });

        // 5. Clean up Notifications
        await Notification.deleteMany({ $or: [{ recipient: userId }, { sender: userId }] });

        // 6. Finally, delete the User document
        await User.findByIdAndDelete(userId);

        res.json({ message: 'Account and all associated data deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    deleteAccount,
};