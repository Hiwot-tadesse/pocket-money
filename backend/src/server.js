const path = require('path');
const fs = require('fs');

// Always load .env from the backend root (one level up from src/), no matter where the process is started from.
const envPath = path.resolve(__dirname, '..', '.env');
const envExists = fs.existsSync(envPath);
const dotenvResult = require('dotenv').config({ path: envPath });

const app = require('./app');
const { connectDB } = require('./config/database');
const { verifyTransporter, isConfigured } = require('./utils/emailService');

const PORT = process.env.PORT || 5000;

const mask = (v) => (!v ? '(not set)' : v.length <= 6 ? '****' : v.slice(0, 4) + '****' + v.slice(-4));

const getOpenRouterModels = async () => {
  const configured = process.env.OPENROUTER_MODEL;
  const fallbackModels = [
    configured,
    'deepseek/deepseek-chat-v3-0324:free',
    'deepseek/deepseek-chat:free',
    'deepseek/deepseek-r1:free',
    'deepseek/deepseek-r1-0528:free',
  ].filter(Boolean);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models');
    const result = await response.json();
    const liveDeepSeekFreeModels = (result?.data || [])
      .map((model) => model.id)
      .filter((id) => id?.startsWith('deepseek/') && id.endsWith(':free'));
    return [...new Set([...fallbackModels, ...liveDeepSeekFreeModels])];
  } catch (_) {
    return [...new Set(fallbackModels)];
  }
};

const verifyOpenRouterKey = async () => {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    console.log('[OpenRouter] API key: ✗ NOT SET – chatbot will not work');
    return;
  }
  try {
    let lastError = null;

    for (const model of await getOpenRouterModels()) {
    const res = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_PUBLIC_URL || 'http://localhost:5000',
          'X-Title': 'Pocket Money API Verification',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 8,
        }),
      }
    );
    const data = await res.json();
    if (res.ok && data?.choices) {
      console.log(`[OpenRouter] API key: ✓ VALID – chatbot ready (${model})`);
      return;
    }
    lastError = data?.error?.message || `HTTP ${res.status}`;
    }

    console.log('[OpenRouter] API key: ✗ INVALID / QUOTA –', lastError);
  } catch (e) {
    console.log('[OpenRouter] API key: ✗ NETWORK ERROR –', e.message);
  }
};

const printEnvDiagnostics = () => {
  console.log('\n========== ENV DIAGNOSTICS ==========');
  console.log(`.env path:       ${envPath}`);
  console.log(`.env file exists: ${envExists ? '✓ yes' : '✗ NO – file missing!'}`);
  if (dotenvResult.error) console.log(`dotenv error:    ${dotenvResult.error.message}`);
  console.log(`Loaded keys:     ${dotenvResult.parsed ? Object.keys(dotenvResult.parsed).join(', ') : '(none)'}`);
  console.log('-------------------------------------');
  console.log(`NODE_ENV:        ${process.env.NODE_ENV || '(not set)'}`);
  console.log(`PORT:            ${process.env.PORT || '(not set)'}`);
  console.log(`MONGODB_URI:     ${process.env.MONGODB_URI ? '✓ set (' + mask(process.env.MONGODB_URI) + ')' : '✗ NOT SET'}`);
  console.log(`JWT_SECRET:      ${process.env.JWT_SECRET ? '✓ set' : '✗ NOT SET'}`);
  console.log(`OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? '✓ set (' + mask(process.env.OPENROUTER_API_KEY) + ')' : '✗ NOT SET'}`);
  console.log(`OPENROUTER_MODEL:   deepseek/deepseek-chat-v3-0324:free`);
  console.log(`SMTP_HOST:       ${process.env.SMTP_HOST || '(not set)'}`);
  console.log(`SMTP_USER:       ${process.env.SMTP_USER || '(not set)'}`);
  console.log(`SMTP_PASS:       ${process.env.SMTP_PASS ? '✓ set (' + mask(process.env.SMTP_PASS) + ')' : '✗ NOT SET'}`);
  console.log(`BREVO_API_KEY:   ${process.env.BREVO_API_KEY ? '✓ set (' + mask(process.env.BREVO_API_KEY) + ')' : '(not set – using SMTP only)'}`);
  console.log('=====================================\n');
};

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, async () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      printEnvDiagnostics();          // ← prints every key from .env on every restart

      // --- Verify every external API declared in .env ---
      console.log('--- API VERIFICATION ---');

      // 1. OpenRouter (chatbot)
      await verifyOpenRouterKey();

      // 2. Email (SMTP or Brevo)
      if (process.env.BREVO_API_KEY) {
        console.log('[Email] Using Brevo HTTP API – no port 587/465 needed');
        console.log('[Email] Brevo API key: ✓ PRESENT');
      } else if (isConfigured()) {
        const ok = await verifyTransporter();
        if (ok) console.log('[Email] SMTP connection verified ✓');
        else console.warn('[Email] SMTP configured but connection failed – check credentials / firewall');
      } else {
        console.warn('[Email] No email provider configured – welcome & reset emails will be skipped');
      }

      console.log('--- ALL CHECKS COMPLETE ---\n');
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
