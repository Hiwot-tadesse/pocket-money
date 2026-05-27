const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const { sendPasswordResetEmail, sendWelcomeEmail } = require('../utils/emailService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { username, email, password, pin } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email
          ? 'Email already registered'
          : 'Username already taken',
      });
    }

    const user = await User.create({ username, email, password, pin });

    const token = generateToken(user._id);

    // Send welcome email in the background - never blocks signup
    sendWelcomeEmail(email, username).catch((err) => {
      console.error('[Email] Welcome email failed:', err.message);
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        currency: user.currency,
        notificationsEnabled: user.notificationsEnabled,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user with email/password
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        currency: user.currency,
        notificationsEnabled: user.notificationsEnabled,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user with PIN
// @route   POST /api/auth/login-pin
const loginWithPin = async (req, res, next) => {
  try {
    const { email, pin } = req.body;

    if (!email || !pin) {
      return res.status(400).json({
        success: false,
        message: 'Email and PIN are required',
      });
    }

    const user = await User.findOne({ email }).select('+pin');
    if (!user || !user.pin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials or PIN not set',
      });
    }

    const isMatch = await user.comparePin(pin);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid PIN',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        currency: user.currency,
        notificationsEnabled: user.notificationsEnabled,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
const updateProfile = async (req, res, next) => {
  try {
    const { username, currency, notificationsEnabled, phone } = req.body;
    const updates = {};

    if (username) updates.username = username;
    if (currency) updates.currency = currency;
    if (typeof phone === 'string') updates.phone = phone;
    if (typeof notificationsEnabled === 'boolean') {
      updates.notificationsEnabled = notificationsEnabled;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password - send secure reset link
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Do not reveal whether the email exists (security)
      return res.json({ success: true, message: 'If an account exists, a reset link has been sent.' });
    }

    // Generate a secure random token (not guessable like 6-digit OTP)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    // The link the user will click (deep link into the app)
    // Using custom scheme so it opens the mobile app directly
    const resetUrl = `pocketmoney://reset-password?token=${resetToken}`;

    const emailSent = await sendPasswordResetEmail(user.email, resetUrl).catch(() => false);

    res.json({
      success: true,
      message: emailSent
        ? 'If an account exists, a reset link has been sent to your email.'
        : 'If an account exists, a reset link has been generated (email not configured).',
      data: { expiresIn: '1 hour', emailSent: !!emailSent },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using secure token from email link
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Reset token and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    // Hash the token the same way we did on forgot-password
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset link. Please request a new one.' });
    }

    // Set the new password
    user.password = newPassword;
    // Invalidate the token (single-use)
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  loginWithPin,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
};
