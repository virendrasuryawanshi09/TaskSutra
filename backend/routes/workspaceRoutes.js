const express = require("express");
const { protect, ceoOnly, adminOrCeo } = require("../middlewares/authMiddleware");
const {
  addWorkspaceMember,
  removeWorkspaceMember,
  updateWorkspaceMember,
  verifyDomain,
  confirmDomain,
  createInvitation,
  validateInvitation,
  getCompanyDetails,
  createCompany,
} = require("../controllers/workspaceController");

const router = express.Router();

// Public invitation validation path (accessible without JWT)
router.get("/invitations/validate/:token", validateInvitation);

// Apply protect middleware to all routes below
router.use(protect);

// Company Info Endpoints (available to Admin & CEO, creation only checks JWT)
router.get("/company", adminOrCeo, getCompanyDetails);
router.post("/company", createCompany);

// Workspace Member Endpoints (requires Admin or CEO)
router.post("/members", adminOrCeo, addWorkspaceMember);
router.delete("/members/:id", adminOrCeo, removeWorkspaceMember);
router.put("/members/:id", adminOrCeo, updateWorkspaceMember);

// Domain Verification Endpoints (requires CEO Only)
router.post("/verify-domain", ceoOnly, verifyDomain);
router.post("/confirm-domain", ceoOnly, confirmDomain);

// Secure Invitation Endpoints (requires Admin or CEO)
router.post("/invitations", adminOrCeo, createInvitation);

module.exports = router;
