const express = require("express");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const {
  addWorkspaceMember,
  removeWorkspaceMember,
  updateWorkspaceMember,
  verifyDomain,
  confirmDomain,
} = require("../controllers/workspaceController");

const router = express.Router();

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

module.exports = router;
