const User = require("../models/User");
const Task = require("../models/Task");
const TaskDiscussion = require("../models/TaskDiscussion");
const TaskMessage = require("../models/TaskMessage");
const DirectChat = require("../models/DirectChat");
const DirectMessage = require("../models/DirectMessage");
const Message = require("../models/Message");
const bcrypt = require("bcryptjs");

/**
 * Service to handle scalable workspace member logic
 */
class WorkspaceService {
  /**
   * Invites or directly adds a new member to the workspace
   */
  async addMember({ name, email, password, role = "member", title = "", company = "", skills = [] }) {
    // 1. Email format and presence check
    if (!name || !email || !password) {
      throw new Error("Missing required profile fields: name, email, or password");
    }

    const emailLower = email.toLowerCase().trim();

    // 2. Check email uniqueness
    const existingUser = await User.findOne({ email: emailLower });
    if (existingUser) {
      throw new Error("A user with this email address is already a member of this workspace");
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create new member
    const newMember = new User({
      name,
      email: emailLower,
      password: hashedPassword,
      role,
      title,
      company,
      skills,
    });

    await newMember.save();

    // Remove password from returned object
    const memberObj = newMember.toObject();
    delete memberObj.password;

    return memberObj;
  }

  /**
   * Comprehensive cleanup service to remove a user from the workspace.
   * Revokes all assignments, deletes active chats/discussions, and purges workspace access.
   */
  async removeMember(userId) {
    // 1. Validate if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("Workspace member not found");
    }

    // Protect against removing the primary admin
    if (user.role === "admin") {
      throw new Error("Access Denied: Main admin accounts cannot be deleted to ensure workspace stability");
    }

    // 2. Revoke task assignments
    // Pull user from assignedTo array on all tasks
    await Task.updateMany(
      { assignedTo: userId },
      { $pull: { assignedTo: userId } }
    );

    // 3. Clean up task discussions participants
    await TaskDiscussion.updateMany(
      { participants: userId },
      { $pull: { participants: userId } }
    );

    // 4. Clean up task discussion messages sent by the user
    await TaskMessage.deleteMany({ sender: userId });

    // 5. Clean up community messages
    await Message.deleteMany({ sender: userId });

    // 6. Find and clean up private Direct Chats
    // Fetch all chats where the user is a participant
    const userChats = await DirectChat.find({ participants: userId });
    const chatIds = userChats.map(chat => chat._id);

    if (chatIds.length > 0) {
      // Delete all direct messages in these chats
      await DirectMessage.deleteMany({ chatId: { $in: chatIds } });
      
      // Delete direct chats themselves
      await DirectChat.deleteMany({ _id: { $in: chatIds } });
    }

    // Also delete any direct messages sent by this user in other chats (if any exist)
    await DirectMessage.deleteMany({ sender: userId });

    // 7. Delete the User record to completely revoke workspace access
    await User.findByIdAndDelete(userId);

    return {
      success: true,
      message: `Successfully removed member ${user.name} and cleaned up all associated workspace assets.`,
    };
  }

  /**
   * Updates workspace membership details (role, title, department, skills)
   */
  async updateMemberDetails(userId, updateData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("Workspace member not found");
    }

    // Do not allow changing main admin roles arbitrarily
    if (user.role === "admin" && updateData.role === "member") {
      throw new Error("Cannot demote the primary administrator");
    }

    const allowedFields = ["name", "role", "title", "company", "skills", "bio"];
    
    // Apply updates
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field];
      }
    });

    await user.save();

    const updatedUserObj = user.toObject();
    delete updatedUserObj.password;

    return updatedUserObj;
  }
}

module.exports = new WorkspaceService();
