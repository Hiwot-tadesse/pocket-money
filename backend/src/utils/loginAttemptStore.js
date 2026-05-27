const ATTEMPT_WINDOW_MS = parseInt(process.env.LOGIN_ATTEMPT_WINDOW_MS || '900000', 10);
const BLOCK_DURATION_MS = parseInt(process.env.LOGIN_BLOCK_DURATION_MS || '900000', 10);
const MAX_ATTEMPTS = parseInt(process.env.LOGIN_MAX_ATTEMPTS || '5', 10);

const attempts = new Map();

const getLoginKey = (req, email = '') => {
  const ip = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
  const safeEmail = String(email || '').toLowerCase().trim();
  return `${ip}:${safeEmail}`;
};

const resetAttemptWindow = (key) => {
  attempts.set(key, {
    count: 0,
    firstAttemptAt: Date.now(),
    blockedUntil: 0,
  });
};

const isLoginBlocked = (key) => {
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

  if (now - record.firstAttemptAt > ATTEMPT_WINDOW_MS) {
    attempts.delete(key);
    return { blocked: false };
  }

  return { blocked: false };
};

const registerLoginFailure = (key) => {
  const now = Date.now();
  let record = attempts.get(key);

  if (!record || now - record.firstAttemptAt > ATTEMPT_WINDOW_MS) {
    record = { count: 0, firstAttemptAt: now, blockedUntil: 0 };
  }

  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
  }

  attempts.set(key, record);
  return record;
};

const clearLoginAttempts = (key) => {
  attempts.delete(key);
};

module.exports = {
  getLoginKey,
  isLoginBlocked,
  registerLoginFailure,
  clearLoginAttempts,
  resetAttemptWindow,
};
