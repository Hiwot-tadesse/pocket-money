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

const RESET_HTML = (resetUrl, deepLinkUrl, expiresIn = '1 hour') => `
  <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:16px;">
    <h2 style="text-align:center;color:#111827;">Reset Your Password</h2>
    <p style="text-align:center;color:#6B7280;">Click the button below to securely reset your password. This link expires in <strong>${expiresIn}</strong>.</p>
    
    <div style="text-align:center;margin:32px 0;">
      <a href="${resetUrl}" 
         style="background:#6366F1;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;display:inline-block;">
        Reset Password
      </a>
    </div>

    <p style="text-align:center;color:#9CA3AF;font-size:13px;">
      If the button doesn't work, copy and paste this link:<br>
      <a href="${resetUrl}" style="color:#6366F1;word-break:break-all;">${resetUrl}</a>
    </p>

    ${deepLinkUrl && deepLinkUrl !== resetUrl ? `
      <p style="text-align:center;color:#9CA3AF;font-size:12px;margin-top:12px;">
        Mobile app link:<br>
        <a href="${deepLinkUrl}" style="color:#6366F1;word-break:break-all;">${deepLinkUrl}</a>
      </p>
    ` : ''}

    <p style="text-align:center;color:#9CA3AF;font-size:13px;margin-top:24px;">
      If you didn't request a password reset, you can safely ignore this email.
    </p>
  </div>`;

const WELCOME_HTML = (username) => `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;background:#f9fafb;border-radius:16px;">
    <h2 style="text-align:center;color:#111827;">Welcome to Pocket Money, ${username}!</h2>
    <p style="text-align:center;color:#6B7280;font-size:16px;line-height:1.6;">
      You have taken a smart step toward understanding your money, building better habits, and reaching your financial goals.
    </p>
    <div style="background:#EEF2FF;border-radius:14px;padding:20px;margin:24px 0;">
      <p style="margin:0;color:#4338CA;font-size:16px;line-height:1.6;text-align:center;font-weight:700;">
        Small daily choices become big financial wins. Keep tracking, keep learning, and keep moving forward.
      </p>
    </div>
    <p style="text-align:center;color:#6B7280;font-size:15px;line-height:1.6;">
      Start by recording your first income or expense today — your future self will thank you.
    </p>
  </div>`;

const trySend = async (toEmail, toName, subject, html, text) => {
  const attempts = [];
  if (process.env.BREVO_API_KEY) {
    attempts.push(async () => {
      console.log(`[Email] Sending via Brevo to ${toEmail}...`);
      await sendViaBrevo(toEmail, toName, subject, html, text);
      console.log('[Email] Sent via Brevo ✓');
      return true;
    });
  }
  if (isConfigured()) {
    attempts.push(async () => {
      console.log(`[Email] Sending via SMTP to ${toEmail}...`);
      const transporter = createTransporter();
      const info = await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME || 'Pocket Money'}" <${process.env.SMTP_USER}>`,
        to: toEmail, subject, html, text,
      });
      console.log(`[Email] Sent via SMTP ✓ msgId: ${info.messageId}`);
      return true;
    });
  }

  if (attempts.length === 0) {
    console.warn('[Email] No email provider configured – skipping.');
    return false;
  }

  let lastError = null;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (error) {
      lastError = error;
      console.warn('[Email] Provider send attempt failed:', error.message);
    }
  }

  throw lastError || new Error('All email provider attempts failed');
};

const sendPasswordResetEmail = async (toEmail, resetUrl, deepLinkUrl, expiresIn = '1 hour') => {
  return trySend(
    toEmail, toEmail,
    'Reset Your Password – Pocket Money',
    RESET_HTML(resetUrl, deepLinkUrl, expiresIn),
    `Click this link to reset your password:\n${resetUrl}\n\nMobile link: ${deepLinkUrl || resetUrl}\n\nThis link expires in ${expiresIn}. If you did not request this, ignore this email.`,
  );
};

const sendWelcomeEmail = async (toEmail, username) => {
  return trySend(
    toEmail, username,
    `Welcome to Pocket Money, ${username}!`,
    WELCOME_HTML(username),
    `Welcome to Pocket Money, ${username}!\n\nYou have taken a smart step toward understanding your money, building better habits, and reaching your financial goals.\n\nSmall daily choices become big financial wins. Keep tracking, keep learning, and keep moving forward.\n\nStart by recording your first income or expense today — your future self will thank you.`,
  );
};

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  isConfigured,
  verifyTransporter,
};
