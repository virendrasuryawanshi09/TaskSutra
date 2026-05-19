const workspaceService = require("../services/workspaceService");

/**
 * Exposes controllers for enterprise workspace membership actions
 */
const addWorkspaceMember = async (req, res) => {
  try {
    const { name, email, password, role, title, company, skills } = req.body;

    const newMember = await workspaceService.addMember({
      name,
      email,
      password,
      role,
      title,
      company,
      skills,
    });

    res.status(201).json({
      success: true,
      message: "Workspace member added successfully",
      member: newMember,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to add workspace member",
    });
  }
};

const removeWorkspaceMember = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent administrators from deleting themselves
    if (String(req.user._id || req.user.id) === String(id)) {
      return res.status(400).json({
        success: false,
        message: "Operation Denied: You cannot delete your own admin account from this interface",
      });
    }

    const cleanupResult = await workspaceService.removeMember(id);

    res.status(200).json(cleanupResult);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to remove workspace member",
    });
  }
};

const updateWorkspaceMember = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedMember = await workspaceService.updateMemberDetails(id, updateData);

    res.status(200).json({
      success: true,
      message: "Workspace member updated successfully",
      member: updatedMember,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update workspace member",
    });
  }
};

module.exports = {
  addWorkspaceMember,
  removeWorkspaceMember,
  updateWorkspaceMember,
};
