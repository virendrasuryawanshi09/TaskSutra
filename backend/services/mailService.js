const nodemailer = require("nodemailer");

const sendInviteEmail = async (toEmail, inviteLink, companyName, senderName) => {
  let transporter;
  let isEthereal = false;

  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS &&
      !process.env.SMTP_USER.includes("YOUR_GMAIL")) {
    // Real SMTP (e.g. Gmail)
    transporter = nodemailer.createTransport({
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
  } else {
    // Ethereal fallback for local development (does NOT deliver to real inboxes)
    isEthereal = true;
    console.warn("[MAIL] No real SMTP config found — falling back to Ethereal test account. Email will NOT reach a real inbox.");
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (err) {
      console.warn("Failed to create Ethereal test account:", err.message);
      console.log(`[INVITE FALLBACK] Link for ${toEmail}: ${inviteLink}`);
      return { logged: true };
    }
  }

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafa; padding: 48px 24px; color: #171717; line-height: 1.6;">
      <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);">
        
        <!-- Premium Branding Header -->
        <div style="padding: 32px 40px 16px 40px; border-bottom: 1px solid #f5f5f5; text-align: left;">
          <span style="font-size: 20px; font-weight: 800; tracking-tight: -0.03em; color: #0f172a; font-family: sans-serif;">
            Task<span style="color: #1f6f78;">Sutra</span>
          </span>
        </div>
        
        <!-- Main Email Body -->
        <div style="padding: 32px 40px;">
          <p style="font-size: 14px; color: #404040; margin-bottom: 20px; font-weight: 500;">
            Hello,
          </p>
          
          <p style="font-size: 14px; color: #404040; margin-bottom: 20px; line-height: 1.6;">
            You have been invited to join the workspace <strong>"${companyName}"</strong> on Tasksutra.
          </p>
          
          <p style="font-size: 14px; color: #404040; margin-bottom: 24px; line-height: 1.6;">
            Tasksutra helps teams collaborate efficiently through project management, task tracking, communication, and workflow organization in one unified workspace.
          </p>
          
          <p style="font-size: 14px; color: #404040; margin-bottom: 12px; font-weight: 600;">
            By joining this workspace, you will be able to:
          </p>
          <ul style="font-size: 14px; color: #404040; margin-bottom: 24px; padding-left: 20px; list-style-type: disc; line-height: 1.6;">
            <li style="margin-bottom: 6px;">Access assigned projects and tasks</li>
            <li style="margin-bottom: 6px;">Collaborate with your team members</li>
            <li style="margin-bottom: 6px;">Track progress and updates</li>
            <li style="margin-bottom: 6px;">Participate in your organization’s workflow system</li>
          </ul>
          
          <p style="font-size: 14px; color: #404040; margin-bottom: 20px;">
            To accept this invitation, click the secure link below:
          </p>
          
          <!-- Call to Action Button -->
          <div style="margin: 24px 0;">
            <a href="${inviteLink}" style="background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 13px; font-weight: 600; display: inline-block; transition: background-color 0.2s ease; border: 1px solid #0f172a; text-align: center;">
              Accept Invitation
            </a>
          </div>
          
          <div style="font-size: 12px; color: #737373; margin-top: 32px; line-height: 1.6; border-left: 2px solid #e5e5e5; padding-left: 12px;">
            <span style="font-weight: 600; display: block; margin-bottom: 4px;">Please note:</span>
            &bull; This invitation link will expire in 10 minutes for security purposes.<br />
            &bull; If you were not expecting this invitation, you may safely ignore this email.
          </div>
          
          <hr style="border: 0; border-top: 1px solid #f5f5f5; margin: 28px 0;" />
          
          <p style="font-size: 13px; color: #404040; line-height: 1.6; margin-bottom: 0;">
            Best regards,<br />
            <strong>${companyName} Team</strong><br />
            <span style="font-size: 11px; color: #737373;">Powered by Tasksutra</span>
          </p>

          <p style="font-size: 11px; color: #a3a3a3; word-break: break-all; margin-top: 28px; margin-bottom: 0;">
            If the button doesn't work, copy and paste this URL into your browser:<br />
            <a href="${inviteLink}" style="color: #1f6f78; text-decoration: none;">${inviteLink}</a>
          </p>
        </div>
      </div>
    </div>
  `;

  // For Gmail/SMTP compatibility, compile a friendly display name pointing to the system SMTP address
  const senderFriendlyName = `${senderName} via TaskSutra`;
  const systemEmail = process.env.SMTP_USER || "invites@tasksutra.com";
  const fromEmail = `"${senderFriendlyName}" <${systemEmail}>`;

  const mailOptions = {
    from: fromEmail,
    to: toEmail,
    subject: `[TaskSutra] Collaboration invite for ${companyName} from ${senderName}`,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);

    if (isEthereal) {
      const testUrl = nodemailer.getTestMessageUrl(info);
      console.log(`\n[ETHEREAL MAIL] Preview URL (not a real inbox): ${testUrl}\n`);
      return { success: true, previewUrl: testUrl };
    }

    console.log(`[SMTP] Email sent successfully to ${toEmail}`);
    return { success: true };
  } catch (err) {
    console.error("Error sending mail:", err.message);
    // Throw so the controller returns a proper error response to the frontend
    throw new Error(`Failed to send invitation email: ${err.message}`);
  }
};

module.exports = { sendInviteEmail };
