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
  console.log(`GEMINI_API_KEY:  ${process.env.GEMINI_API_KEY ? '✓ set (' + mask(process.env.GEMINI_API_KEY) + ')' : '✗ NOT SET'}`);
  console.log(`SMTP_HOST:       ${process.env.SMTP_HOST || '(not set)'}`);
  console.log(`SMTP_USER:       ${process.env.SMTP_USER || '(not set)'}`);
  console.log(`SMTP_PASS:       ${process.env.SMTP_PASS ? '✓ set (' + mask(process.env.SMTP_PASS) + ')' : '✗ NOT SET'}`);
  console.log(`BREVO_API_KEY:   ${process.env.BREVO_API_KEY ? '✓ set (' + mask(process.env.BREVO_API_KEY) + ')' : '(not set – using SMTP only)'}`);
  console.log('=====================================\n');
};

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log('[Email] Config check → SMTP_HOST:', process.env.SMTP_HOST || '(not set)');
      console.log('[Email] Config check → SMTP_USER:', process.env.SMTP_USER || '(not set)');
      console.log('[Email] Config check → SMTP_PASS:', process.env.SMTP_PASS ? '****' + process.env.SMTP_PASS.slice(-4) : '(not set)');
      if (isConfigured()) {
        verifyTransporter().then((ok) => {
          if (ok) console.log('[Email] SMTP connection verified ✓');
          else console.warn('[Email] SMTP configured but connection failed – check credentials');
        });
      } else {
        console.warn('[Email] SMTP not configured – emails disabled. Add SMTP_USER & SMTP_PASS to .env');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
