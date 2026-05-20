const express = require("express");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const {
  addWorkspaceMember,
  removeWorkspaceMember,
  updateWorkspaceMember,
  verifyDomain,
  confirmDomain,
  createInvitation,
  validateInvitation,
} = require("../controllers/workspaceController");

const router = express.Router();

// Public invitation validation path (accessible without JWT)
router.get("/invitations/validate/:token", validateInvitation);

// Apply global middlewares to secure workspace management endpoints
router.use(protect);
router.use(adminOnly);

// Workspace Member Endpoints
router.post("/members", addWorkspaceMember);
router.delete("/members/:id", removeWorkspaceMember);
router.put("/members/:id", updateWorkspaceMember);

// Domain Verification Endpoints
router.post("/verify-domain", verifyDomain);
router.post("/confirm-domain", confirmDomain);

// Secure Invitation Endpoints
router.post("/invitations", createInvitation);

module.exports = router;
