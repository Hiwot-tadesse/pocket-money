const express = require('express');
const {
  getSummary,
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  getByCategory,
} = require('../controllers/report.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/summary', getSummary);
router.get('/daily', getDailyReport);
router.get('/weekly', getWeeklyReport);
router.get('/monthly', getMonthlyReport);
router.get('/by-category', getByCategory);

module.exports = router;
