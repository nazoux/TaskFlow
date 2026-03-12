const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendResetEmail(toEmail, resetLink) {
  await transporter.sendMail({
    from: `"TaskFlow" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Reset your TaskFlow password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <svg width="40" height="40" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 22l12-8 12 8" stroke="#4a7cbd" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6 17l12-8 12 8" stroke="#4a7cbd" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
            <path d="M6 27l12-8 12 8" stroke="#4a7cbd" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.3"/>
          </svg>
          <h2 style="color: #1a1a2e; margin: 8px 0 0;">TaskFlow</h2>
        </div>
        <h3 style="color: #1a1a2e;">Reset your password</h3>
        <p style="color: #555; line-height: 1.6;">
          You requested a password reset. Click the button below to set a new password.
          This link expires in <strong>1 hour</strong>.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" style="background: #4a7cbd; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Reset password
          </a>
        </div>
        <p style="color: #999; font-size: 13px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `
  });
}

module.exports = { sendResetEmail };
