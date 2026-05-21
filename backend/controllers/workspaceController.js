const workspaceService = require("../services/workspaceService");
const Company = require("../models/Company");
const Invitation = require("../models/Invitation");
const User = require("../models/User");
const dns = require("dns");
const crypto = require("crypto");

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

    // Check if there is already a pending invitation for this email
    const existingInvite = await Invitation.findOne({ email, status: "pending", expiresAt: { $gt: new Date() } });
    if (existingInvite) {
      return res.status(400).json({ success: false, message: "A pending invitation already exists for this email" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await Invitation.create({
      email,
      companyId: req.user.companyId,
      token,
      expiresAt,
    });

    const inviteLink = `http://localhost:5173/signup?token=${token}`;
    console.log(`\n[DEMO INVITE] Generated 10-minute invitation for ${email}:\nLink: ${inviteLink}\n`);

    res.status(201).json({
      success: true,
      message: "Invitation created successfully",
      inviteLink,
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

    // Prevent deleting the CEO/Workspace Owner
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "Workspace member not found" });
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

    const cleanDomain = domain.trim().toLowerCase();

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
