const RESET_ATTEMPT_WINDOW_MS = parseInt(process.env.RESET_ATTEMPT_WINDOW_MS || '900000', 10);
const RESET_BLOCK_DURATION_MS = parseInt(process.env.RESET_BLOCK_DURATION_MS || '900000', 10);
const RESET_MAX_ATTEMPTS = parseInt(process.env.RESET_MAX_ATTEMPTS || '5', 10);

const attempts = new Map();

const getResetKey = (req) => {
  const ip = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
  return ip || 'unknown';
};

const isResetBlocked = (key) => {
  const record = attempts.get(key);
  if (!record) return { blocked: false };

  const now = Date.now();
  if (record.blockedUntil && record.blockedUntil > now) {
    return {
      blocked: true,
      retryAfterSeconds: Math.ceil((record.blockedUntil - now) / 1000),
    };
  }

  if (record.blockedUntil && record.blockedUntil <= now) {
    attempts.delete(key);
    return { blocked: false };
  }

  if (now - record.firstAttemptAt > RESET_ATTEMPT_WINDOW_MS) {
    attempts.delete(key);
    return { blocked: false };
  }

  return { blocked: false };
};

const registerResetAttempt = (key) => {
  const now = Date.now();
  let record = attempts.get(key);

  if (!record || now - record.firstAttemptAt > RESET_ATTEMPT_WINDOW_MS) {
    record = { count: 0, firstAttemptAt: now, blockedUntil: 0 };
  }

  record.count += 1;
  if (record.count >= RESET_MAX_ATTEMPTS) {
    record.blockedUntil = now + RESET_BLOCK_DURATION_MS;
  }

  attempts.set(key, record);
  return record;
};

const clearResetAttempts = (key) => {
  attempts.delete(key);
};

module.exports = {
  getResetKey,
  isResetBlocked,
  registerResetAttempt,
  clearResetAttempts,
};
