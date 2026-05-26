const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const isConfigured = () => !!(process.env.SMTP_USER && process.env.SMTP_PASS);

const verifyTransporter = async () => {
  if (!isConfigured()) return false;
  try {
    const t = createTransporter();
    await t.verify();
    return true;
  } catch (err) {
    console.error('[Email] SMTP connection failed:', err.message);
    return false;
  }
};

const sendPasswordResetEmail = async (toEmail, otp, expiresIn = '15 minutes') => {
  if (!isConfigured()) {
    console.warn('[Email] SMTP not configured – skipping. Add SMTP_USER & SMTP_PASS to .env');
    return false;
  }

  console.log(`[Email] Sending password reset OTP to ${toEmail}...`);
  const transporter = createTransporter();
  const fromName = process.env.SMTP_FROM_NAME || 'Pocket Money';
  const fromEmail = process.env.SMTP_USER;

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject: 'Your Password Reset Code – Pocket Money',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:#6366F1;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:28px;color:#fff;">🔑</div>
        </div>
        <h2 style="text-align:center;color:#111827;margin-bottom:8px;">Password Reset</h2>
        <p style="text-align:center;color:#6B7280;margin-bottom:24px;">Use the code below to reset your password. It expires in <strong>${expiresIn}</strong>.</p>
        <div style="background:#EEF2FF;border:2px solid #6366F1;border-radius:12px;padding:20px 32px;text-align:center;margin-bottom:24px;">
          <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#4F46E5;">${otp}</span>
        </div>
        <p style="text-align:center;color:#9CA3AF;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">
        <p style="text-align:center;color:#9CA3AF;font-size:12px;">Pocket Money Tracker · Track your finances</p>
      </div>
    `,
    text: `Your password reset code is: ${otp}\n\nThis code expires in ${expiresIn}.\n\nIf you didn't request this, ignore this email.`,
  });
  console.log(`[Email] Password reset email sent. Message ID: ${info.messageId}`);
  return true;
};

const sendWelcomeEmail = async (toEmail, username) => {
  if (!isConfigured()) {
    console.warn('[Email] SMTP not configured – welcome email skipped for', toEmail);
    return false;
  }

  console.log(`[Email] Sending welcome email to ${toEmail}...`);
  const transporter = createTransporter();
  const fromName = process.env.SMTP_FROM_NAME || 'Pocket Money';
  const fromEmail = process.env.SMTP_USER;

  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    subject: `Welcome to Pocket Money, ${username}!`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="display:inline-block;background:#6366F1;border-radius:50%;width:64px;height:64px;line-height:64px;font-size:28px;color:#fff;">💰</div>
        </div>
        <h2 style="text-align:center;color:#111827;">Welcome, ${username}!</h2>
        <p style="text-align:center;color:#6B7280;margin-bottom:24px;">Your Pocket Money account is ready. Start tracking your finances today!</p>
        <p style="text-align:center;color:#9CA3AF;font-size:12px;">Pocket Money Tracker · Track your finances</p>
      </div>
    `,
    text: `Welcome to Pocket Money, ${username}!\n\nYour account is ready. Start tracking your finances today!`,
  });
  console.log(`[Email] Welcome email sent to ${toEmail}`);
  return true;
};

module.exports = { sendPasswordResetEmail, sendWelcomeEmail, isConfigured };
