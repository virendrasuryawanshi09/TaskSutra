const User = require("../models/User");
const Task = require("../models/Task");
const bcrypt = require("bcryptjs");

/**
 * Service to handle enterprise workspace member operations
 */
const addMember = async ({ name, email, password, role, title, company, skills }) => {
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new Error("User already exists with this email");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newMember = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || "member",
    title: title || "",
    company: company || "",
    skills: skills || [],
  });

  // Return member without password
  const memberObj = newMember.toObject();
  delete memberObj.password;
  return memberObj;
};

const removeMember = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new Error("Workspace member not found");
  }

  // Delete the user
  await User.findByIdAndDelete(id);

  // Unassign user from all tasks they were assigned to
  await Task.updateMany(
    { assignedTo: id },
    { $pull: { assignedTo: id } }
  );

  return {
    success: true,
    message: "Workspace member removed successfully and unassigned from all tasks",
  };
};

const updateMemberDetails = async (id, updateData) => {
  const user = await User.findById(id);
  if (!user) {
    throw new Error("Workspace member not found");
  }

  // Update fields
  if (updateData.name !== undefined) user.name = updateData.name;
  if (updateData.email !== undefined) {
    const emailExists = await User.findOne({ email: updateData.email, _id: { $ne: id } });
    if (emailExists) {
      throw new Error("Email already in use by another user");
    }
    user.email = updateData.email;
  }
  if (updateData.role !== undefined) user.role = updateData.role;
  if (updateData.title !== undefined) user.title = updateData.title;
  if (updateData.company !== undefined) user.company = updateData.company;
  if (updateData.skills !== undefined) user.skills = updateData.skills;
  if (updateData.profileImageUrl !== undefined) user.profileImageUrl = updateData.profileImageUrl;

  if (updateData.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(updateData.password, salt);
  }

  const updatedUser = await user.save();
  const updatedUserObj = updatedUser.toObject();
  delete updatedUserObj.password;
  return updatedUserObj;
};

module.exports = {
  addMember,
  removeMember,
  updateMemberDetails,
};
