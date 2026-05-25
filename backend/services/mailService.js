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
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f6f9fc; padding: 40px 20px; text-align: center; color: #333;">
      <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <!-- Top branding bar -->
        <div style="background-color: #1f6f78; padding: 25px; color: #ffffff; font-size: 24px; font-weight: bold; letter-spacing: 1px; text-align: center;">
          TaskSutra
        </div>
        <div style="padding: 40px 30px; text-align: left;">
          <h2 style="color: #1a202c; font-size: 20px; font-weight: 700; margin-top: 0;">You've been invited!</h2>
          <p style="font-size: 15px; color: #4a5568; line-height: 1.6; margin-bottom: 24px;">
            Hi there,
          </p>
          <p style="font-size: 15px; color: #4a5568; line-height: 1.6; margin-bottom: 24px;">
            <strong>${senderName}</strong> has invited you to join the <strong>${companyName}</strong> workspace on TaskSutra, a premium project management console.
          </p>
          
          <!-- Call to Action Button -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="${inviteLink}" style="background-color: #1f6f78; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-size: 15px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(31,111,120,0.2);">
              Join Workspace
            </a>
          </div>
          
          <p style="font-size: 13px; color: #718096; line-height: 1.5; margin-bottom: 20px;">
            Please note: This invite link is private to you and will expire in exactly <strong>10 minutes</strong>.
          </p>
          <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 25px 0;" />
          <p style="font-size: 12px; color: #a0aec0; line-height: 1.5; margin-bottom: 0;">
            If the button above does not work, copy and paste this URL into your browser:<br />
            <a href="${inviteLink}" style="color: #1f6f78; word-break: break-all;">${inviteLink}</a>
          </p>
        </div>
        <div style="background-color: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7;">
          TaskSutra Enterprise Console &bull; B2B Teamwork Accelerated
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
    subject: `Join ${companyName} on TaskSutra`,
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
