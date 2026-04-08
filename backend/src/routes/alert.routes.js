const express = require('express');
const {
  getAlerts,
  markAsRead,
  markAllAsRead,
  deleteAlert,
} = require('../controllers/alert.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/', getAlerts);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteAlert);

module.exports = router;
