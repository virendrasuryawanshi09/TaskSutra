const nodemailer = require("nodemailer");

// ─── HTML Email Template ──────────────────────────────────────────────────────
const buildInviteHtml = (inviteLink, companyName, senderName) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; padding: 40px 20px; color: #333333; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e4e8; border-top: 4px solid #1f6f78; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
      
      <!-- Header -->
      <div style="padding: 24px 40px; border-bottom: 1px solid #f0f2f5;">
        <h2 style="font-size: 20px; font-weight: 600; margin: 0; color: #1f6f78; font-family: sans-serif;">
          TaskSutra
        </h2>
      </div>
      
      <!-- Main Email Body -->
      <div style="padding: 32px 40px;">
        <p style="font-size: 15px; color: #2c3e50; margin-bottom: 20px;">
          Dear Sir/Madam,
        </p>
        
        <p style="font-size: 15px; color: #34495e; margin-bottom: 20px; line-height: 1.6;">
          You have been formally invited by <strong>${senderName}</strong> to join the <strong>${companyName}</strong> workspace on the TaskSutra platform.
        </p>
        
        <p style="font-size: 15px; color: #34495e; margin-bottom: 24px; line-height: 1.6;">
          Access to this workspace will enable you to securely collaborate, manage assigned projects, and participate in organizational workflows. Please proceed to accept the invitation and configure your account credentials.
        </p>
        
        <!-- Call to Action Button -->
        <div style="margin: 32px 0; text-align: center;">
          <a href="${inviteLink}" style="background-color: #1f6f78; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 4px; font-size: 14px; font-weight: 600; display: inline-block;">
            Access Workspace
          </a>
        </div>
        
        <div style="font-size: 13px; color: #7f8c8d; margin-top: 32px; line-height: 1.6; border-left: 3px solid #1f6f78; background-color: #f8f9fa; padding: 12px 16px;">
          <strong>Important Notice:</strong><br />
          This invitation link is strictly confidential and will expire in <strong>48 hours</strong>. If you are not the intended recipient of this email, please disregard this communication.
        </div>
        
        <hr style="border: 0; border-top: 1px solid #f0f2f5; margin: 32px 0;" />
        
        <p style="font-size: 14px; color: #2c3e50; line-height: 1.6; margin-bottom: 0;">
          Sincerely,<br />
          <strong>${companyName} Administration</strong><br />
        </p>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px 40px; border-top: 1px solid #f0f2f5; font-size: 12px; color: #95a5a6; text-align: center;">
        <p style="margin: 0; margin-bottom: 8px;">
          If you are experiencing issues with the button above, please copy and paste the following URL into your web browser:
        </p>
        <p style="margin: 0; word-break: break-all;">
          <a href="${inviteLink}" style="color: #1f6f78; text-decoration: none;">${inviteLink}</a>
        </p>
        <p style="margin-top: 16px; font-size: 11px;">
          Powered by TaskSutra Enterprise Solutions
        </p>
      </div>
    </div>
  </div>
`;

// ─── Resend (Primary — production grade) ─────────────────────────────────────
const sendViaResend = async (toEmail, inviteLink, companyName, senderName) => {
  const { Resend } = require("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const fromAddress = process.env.RESEND_FROM_EMAIL || "TaskSutra <onboarding@resend.dev>";

  await resend.emails.send({
    from: fromAddress,
    to: toEmail,
    subject: `[TaskSutra] You're invited to join ${companyName}`,
    html: buildInviteHtml(inviteLink, companyName, senderName),
  });

  console.log(`[RESEND] Email sent successfully to ${toEmail}`);
  return { success: true, provider: "resend" };
};

// ─── Gmail / Custom SMTP (Fallback) ──────────────────────────────────────────
const sendViaSmtp = async (toEmail, inviteLink, companyName, senderName) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // Verify connection before sending
  try {
    await transporter.verify();
    console.log("[SMTP] Connection verified successfully.");
  } catch (verifyErr) {
    console.error("[SMTP] Connection verification failed:", verifyErr.message);
    throw new Error(`SMTP connection failed: ${verifyErr.message}. Check your SMTP_USER and SMTP_PASS in .env`);
  }

  const senderFriendlyName = `${senderName} via TaskSutra`;
  const systemEmail = process.env.SMTP_USER || "invites@tasksutra.com";
  const fromEmail = `"${senderFriendlyName}" <${systemEmail}>`;

  const info = await transporter.sendMail({
    from: fromEmail,
    to: toEmail,
    subject: `[TaskSutra] Collaboration invite for ${companyName} from ${senderName}`,
    html: buildInviteHtml(inviteLink, companyName, senderName),
  });

  console.log(`[SMTP] Email sent successfully to ${toEmail} (messageId: ${info.messageId})`);
  return { success: true, provider: "smtp" };
};

// ─── Ethereal (Dev-only fallback — does NOT deliver to real inboxes) ──────────
const sendViaEthereal = async (toEmail, inviteLink, companyName, senderName) => {
  console.warn(
    "[MAIL] No Resend API key or SMTP config found — falling back to Ethereal test account.\n" +
    "       Email will NOT reach a real inbox. Set RESEND_API_KEY in .env for production."
  );

  try {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });

    const info = await transporter.sendMail({
      from: `"TaskSutra" <${testAccount.user}>`,
      to: toEmail,
      subject: `[TaskSutra] Collaboration invite for ${companyName}`,
      html: buildInviteHtml(inviteLink, companyName, senderName),
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`\n[ETHEREAL MAIL] Preview URL (not a real inbox): ${previewUrl}\n`);
    return { success: true, provider: "ethereal", previewUrl };
  } catch (err) {
    // Last resort — just log the link
    console.warn("Failed to create Ethereal account:", err.message);
    console.log(`[INVITE FALLBACK] Link for ${toEmail}: ${inviteLink}`);
    return { logged: true, provider: "console" };
  }
};

// ─── Main Export ─────────────────────────────────────────────────────────────
/**
 * Sends a workspace invite email.
 * Priority: Resend API → Gmail/SMTP → Ethereal (dev fallback)
 */
const sendInviteEmail = async (toEmail, inviteLink, companyName, senderName) => {
  // 1. Use Resend if API key is present (production recommended)
  if (process.env.RESEND_API_KEY) {
    return sendViaResend(toEmail, inviteLink, companyName, senderName);
  }

  // 2. Use Gmail/SMTP if configured
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    !process.env.SMTP_USER.includes("YOUR_GMAIL")
  ) {
    return sendViaSmtp(toEmail, inviteLink, companyName, senderName);
  }

  // 3. Ethereal fallback for local dev
  return sendViaEthereal(toEmail, inviteLink, companyName, senderName);
};

module.exports = { sendInviteEmail };
