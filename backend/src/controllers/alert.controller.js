const Alert = require('../models/Alert');
const Transaction = require('../models/Transaction');
const { checkInactivity } = require('../utils/alertEngine');

// @desc    Get all alerts for the user
// @route   GET /api/alerts
const getAlerts = async (req, res, next) => {
  try {
    const { unreadOnly, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user._id };

    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    // Check for inactivity before returning alerts
    const lastTransaction = await Transaction.findOne({ user: req.user._id })
      .sort({ date: -1 })
      .select('date');

    if (lastTransaction) {
      await checkInactivity(req.user._id, lastTransaction.date);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [alerts, total, unreadCount] = await Promise.all([
      Alert.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Alert.countDocuments(filter),
      Alert.countDocuments({ user: req.user._id, isRead: false }),
    ]);

    res.json({
      success: true,
      data: alerts,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark alert as read
// @route   PUT /api/alerts/:id/read
const markAsRead = async (req, res, next) => {
  try {
    const alert = await Alert.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all alerts as read
// @route   PUT /api/alerts/read-all
const markAllAsRead = async (req, res, next) => {
  try {
    await Alert.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'All alerts marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an alert
// @route   DELETE /api/alerts/:id
const deleteAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found',
      });
    }

    res.json({
      success: true,
      message: 'Alert deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAlerts, markAsRead, markAllAsRead, deleteAlert };
