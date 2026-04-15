const express = require('express');
const { body } = require('express-validator');
const { chat } = require('../controllers/chat.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(protect);

router.post(
  '/',
  [body('message').notEmpty().trim().withMessage('Message is required')],
  chat
);

module.exports = router;
