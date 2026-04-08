const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  loginWithPin,
  getProfile,
  updateProfile,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('pin').optional().isLength({ min: 4, max: 4 }).isNumeric().withMessage('PIN must be 4 digits'),
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.post('/login-pin', loginWithPin);

router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfile);

module.exports = router;
