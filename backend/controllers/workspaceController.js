const workspaceService = require("../services/workspaceService");
const Company = require("../models/Company");
const Invitation = require("../models/Invitation");
const User = require("../models/User");
const dns = require("dns");
const crypto = require("crypto");
const { sendInviteEmail } = require("../services/mailService");

/**
 * Exposes controllers for enterprise workspace membership actions
 */

const verifyDomain = async (req, res) => {
  try {
    const { method } = req.body;
    if (!["otp", "dns"].includes(method)) {
      return res.status(400).json({ success: false, message: "Invalid verification method. Use 'otp' or 'dns'" });
    }

    if (!req.user.companyId) {
      return res.status(400).json({ success: false, message: "User is not associated with any company workspace" });
    }

    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: "Company workspace not found" });
    }

    let verificationCode = "";
    if (method === "otp") {
      verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
      console.log(`[DEMO OTP] Send verification OTP to admin: ${req.user.email} -> Code: ${verificationCode}`);
    } else {
      verificationCode = `tasksutra-site-verification=${Math.random().toString(36).substring(2, 10)}`;
      console.log(`[DEMO DNS] Expecting TXT record on domain ${company.domain} containing value: ${verificationCode}`);
    }

    company.isVerified = false;
    company.verificationMethod = method;
    company.verificationCode = verificationCode;
    await company.save();

    res.status(200).json({
      success: true,
      message: `Verification code generated for method: ${method}`,
      verificationCode,
      domain: company.domain
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const confirmDomain = async (req, res) => {
  try {
    const { code } = req.body;
    if (!req.user.companyId) {
      return res.status(400).json({ success: false, message: "User is not associated with any company workspace" });
    }

    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: "Company workspace not found" });
    }

    if (!company.verificationCode) {
      return res.status(400).json({ success: false, message: "No verification process active for this company" });
    }

    if (company.verificationMethod === "otp") {
      if (code !== company.verificationCode) {
        return res.status(400).json({ success: false, message: "Invalid OTP verification code" });
      }
    } else if (company.verificationMethod === "dns") {
      // Perform DNS TXT lookup with support for demo mock fallback
      try {
        const txtRecords = await dns.promises.resolveTxt(company.domain);
        const flattened = txtRecords.flat();
        const verified = flattened.some(record => record.includes(company.verificationCode));
        
        if (!verified && code !== "MOCK_VERIFY") {
          return res.status(400).json({ 
            success: false, 
            message: `TXT record verification failed. Could not find verification string on ${company.domain}. Send 'MOCK_VERIFY' code to bypass for demo.` 
          });
        }
      } catch (dnsError) {
        // DNS lookup failed, allow mock code bypass for demos
        if (code !== "MOCK_VERIFY") {
          return res.status(400).json({ 
            success: false, 
            message: `DNS lookup failed for ${company.domain}. Send 'MOCK_VERIFY' code to bypass lookup for demo.` 
          });
        }
      }
    }

    company.isVerified = true;
    company.verificationCode = "";
    await company.save();

    res.status(200).json({
      success: true,
      message: "Company domain verified successfully",
      company
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const createInvitation = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    if (!req.user.companyId) {
      return res.status(400).json({ success: false, message: "User is not associated with any company workspace" });
    }

    // Check if the user is already registered
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User with this email is already registered in this system" });
    }

    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: "Associated workspace company not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // If an invitation already exists, reuse/update it instead of failing
    let invitation = await Invitation.findOne({ email, status: "pending" });
    if (invitation) {
      invitation.token = token;
      invitation.expiresAt = expiresAt;
      invitation.companyId = req.user.companyId;
      await invitation.save();
    } else {
      invitation = await Invitation.create({
        email,
        companyId: req.user.companyId,
        token,
        expiresAt,
      });
    }

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/signup?token=${token}`;
    
    // Dispatch invite email (safely handle failures so that the link is still generated)
    const senderName = req.user.name || req.user.email;
    let emailResult = { success: false, nodemailerMissing: false };
    try {
      emailResult = await sendInviteEmail(email, inviteLink, company.name, senderName);
    } catch (mailError) {
      console.error("[MAIL ERROR] Failed to dispatch invitation email:", mailError);
      emailResult.mailError = mailError.message;
    }

    const isFailedMail = !!emailResult.mailError;
    const isNodemailerMissing = !!emailResult.nodemailerMissing;

    res.status(201).json({
      success: true,
      message: isNodemailerMissing 
        ? "Invitation generated, but nodemailer was not installed. Check console fallback."
        : isFailedMail
        ? `Invitation generated, but email sending failed: ${emailResult.mailError}. You can copy the fallback link below.`
        : "Invitation link sent to member email successfully",
      inviteLink,
      previewUrl: emailResult?.previewUrl || null,
      nodemailerMissing: isNodemailerMissing || isFailedMail,
      expiresAt
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const validateInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const invitation = await Invitation.findOne({ token }).populate("companyId", "name domain");
    
    if (!invitation) {
      return res.status(404).json({ success: false, message: "Invitation not found or invalid" });
    }

    if (invitation.status !== "pending" || new Date() > invitation.expiresAt) {
      if (invitation.status === "pending") {
        invitation.status = "expired";
        await invitation.save();
      }
      return res.status(400).json({ success: false, message: "Invitation has expired or already been accepted" });
    }

    res.status(200).json({
      success: true,
      email: invitation.email,
      company: invitation.companyId?.name || "",
      companyId: invitation.companyId?._id || null,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const addWorkspaceMember = async (req, res) => {
  try {
    const { name, email, password, role, title, company, skills } = req.body;

    // Enforce role constraints: only CEO can assign admin or CEO roles
    const targetRole = role || "member";
    if (["admin", "ceo"].includes(targetRole) && req.user.role !== "ceo") {
      return res.status(403).json({
        success: false,
        message: "Operation Denied: Only the CEO/Workspace Owner can assign admin or CEO roles during creation",
      });
    }

    const newMember = await workspaceService.addMember({
      name,
      email,
      password,
      role,
      title,
      company,
      companyId: req.user.companyId,
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

    // Prevent deleting the CEO/Workspace Owner
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Workspace member not found" });
    }
    if (String(targetUser.companyId || '') !== String(req.user.companyId || '')) {
      return res.status(403).json({ success: false, message: "Not authorized to modify this user" });
    }
    if (targetUser.role === "ceo") {
      return res.status(400).json({
        success: false,
        message: "Operation Denied: The CEO/Workspace Owner account cannot be removed from this workspace",
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

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Workspace member not found" });
    }
    if (String(targetUser.companyId || '') !== String(req.user.companyId || '')) {
      return res.status(403).json({ success: false, message: "Not authorized to modify this user" });
    }

    // Administrators can only modify their own info and standard members
    if (req.user.role === "admin") {
      const isSelf = req.user._id.toString() === id;
      if (!isSelf && targetUser.role !== "member") {
        return res.status(403).json({
          success: false,
          message: "Operation Denied: Administrators can only update details of themselves and standard members.",
        });
      }
    }

    // If trying to change role, ensure caller is CEO
    if (updateData.role !== undefined && req.user.role !== "ceo") {
      return res.status(403).json({
        success: false,
        message: "Operation Denied: Only the CEO/Workspace Owner can change member roles",
      });
    }

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

const getCompanyDetails = async (req, res) => {
  try {
    if (!req.user.companyId) {
      return res.status(200).json({ success: true, company: null });
    }
    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: "Workspace company not found" });
    }
    res.status(200).json({ success: true, company });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const createCompany = async (req, res) => {
  try {
    const { name, domain } = req.body;
    if (!name || !domain) {
      return res.status(400).json({ success: false, message: "Workspace name and domain are required" });
    }

    // Check if user is already associated with a company workspace
    const existingUser = await User.findById(req.user._id);
    if (existingUser && existingUser.companyId) {
      return res.status(400).json({ success: false, message: "You are already associated with a company workspace" });
    }

    const cleanDomain = domain.trim().toLowerCase();
    const publicDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'zoho.com', 'protonmail.com', 'mail.com'];
    if (publicDomains.includes(cleanDomain) && process.env.NODE_ENV === 'production') {
      return res.status(400).json({ success: false, message: "Registering a workspace under a public email domain is not permitted" });
    }

    // Check if domain is already registered
    const existingCompany = await Company.findOne({ domain: cleanDomain });
    if (existingCompany) {
      return res.status(400).json({ success: false, message: "A workspace with this domain already exists" });
    }

    // Create company
    const company = await Company.create({
      name: name.trim(),
      domain: cleanDomain,
      ownerId: req.user._id,
      isVerified: false,
    });

    // Update user: role -> ceo, company/companyId set
    const user = await User.findById(req.user._id);
    user.role = "ceo";
    user.companyId = company._id;
    user.company = company.name;
    await user.save();

    res.status(201).json({
      success: true,
      message: "Workspace created successfully. You are now the CEO/Owner.",
      company,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        companyId: user.companyId,
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  addWorkspaceMember,
  removeWorkspaceMember,
  updateWorkspaceMember,
  verifyDomain,
  confirmDomain,
  createInvitation,
  validateInvitation,
  getCompanyDetails,
  createCompany,
};
