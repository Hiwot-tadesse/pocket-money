const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['budget_warning', 'budget_exceeded', 'inactivity', 'milestone', 'general'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedBudget: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Budget',
    },
    relatedTransaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    threshold: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

alertSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
