const nodemailer = require('nodemailer');
const https = require('https');

// --- Brevo (Sendinblue) HTTP API sender (no SMTP ports needed) ---
const sendViaBrevo = (toEmail, toName, subject, htmlContent, textContent) => {
  return new Promise((resolve, reject) => {
    if (!process.env.BREVO_API_KEY) return reject(new Error('BREVO_API_KEY not set'));
    const body = JSON.stringify({
      sender: { name: process.env.SMTP_FROM_NAME || 'Pocket Money', email: process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER },
      to: [{ email: toEmail, name: toName || toEmail }],
      subject,
      htmlContent,
      textContent,
    });
    const req = https.request({
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY, 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(true);
        else reject(new Error(`Brevo API error ${res.statusCode}: ${data}`));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

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

const RESET_HTML = (otp, expiresIn) => `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:16px;">
    <h2 style="text-align:center;color:#111827;">Password Reset</h2>
    <p style="text-align:center;color:#6B7280;">Use the code below. Expires in <strong>${expiresIn}</strong>.</p>
    <div style="background:#EEF2FF;border:2px solid #6366F1;border-radius:12px;padding:20px 32px;text-align:center;margin:24px 0;">
      <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#4F46E5;">${otp}</span>
    </div>
    <p style="text-align:center;color:#9CA3AF;font-size:13px;">If you didn't request this, ignore this email.</p>
  </div>`;

const WELCOME_HTML = (username) => `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:16px;">
    <h2 style="text-align:center;color:#111827;">Welcome, ${username}!</h2>
    <p style="text-align:center;color:#6B7280;">Your Pocket Money account is ready. Start tracking your finances today!</p>
  </div>`;

const trySend = async (toEmail, toName, subject, html, text) => {
  if (process.env.BREVO_API_KEY) {
    console.log(`[Email] Sending via Brevo to ${toEmail}...`);
    await sendViaBrevo(toEmail, toName, subject, html, text);
    console.log(`[Email] Sent via Brevo ✓`);
    return true;
  }
  if (isConfigured()) {
    console.log(`[Email] Sending via SMTP to ${toEmail}...`);
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Pocket Money'}" <${process.env.SMTP_USER}>`,
      to: toEmail, subject, html, text,
    });
    console.log(`[Email] Sent via SMTP ✓ msgId: ${info.messageId}`);
    return true;
  }
  console.warn('[Email] No email provider configured – skipping.');
  return false;
};

const sendPasswordResetEmail = async (toEmail, otp, expiresIn = '15 minutes') => {
  return trySend(
    toEmail, toEmail,
    'Your Password Reset Code – Pocket Money',
    RESET_HTML(otp, expiresIn),
    `Your reset code is: ${otp}\nExpires in ${expiresIn}.`,
  );
};

const sendWelcomeEmail = async (toEmail, username) => {
  return trySend(
    toEmail, username,
    `Welcome to Pocket Money, ${username}!`,
    WELCOME_HTML(username),
    `Welcome to Pocket Money, ${username}!\n\nYour account is ready.`,
  );
};

module.exports = { sendPasswordResetEmail, sendWelcomeEmail, isConfigured, verifyTransporter };
