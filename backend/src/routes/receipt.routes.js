const express = require('express');
const { scanReceipt } = require('../controllers/receipt.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);
router.post('/scan', scanReceipt);

module.exports = router;
