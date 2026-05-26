require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const { verifyTransporter, isConfigured } = require('./utils/emailService');

const PORT = process.env.PORT || 5000;

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
