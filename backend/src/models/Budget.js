const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Budget category is required'],
    },
    limit: {
      type: Number,
      required: [true, 'Budget limit is required'],
      min: [0.01, 'Budget limit must be greater than 0'],
    },
    period: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'monthly',
    },
    spent: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: remaining amount
budgetSchema.virtual('remaining').get(function () {
  return Math.max(0, this.limit - this.spent);
});

// Virtual: percentage used
budgetSchema.virtual('percentageUsed').get(function () {
  if (this.limit === 0) return 0;
  return Math.round((this.spent / this.limit) * 100);
});

// Virtual: is over budget
budgetSchema.virtual('isOverBudget').get(function () {
  return this.spent > this.limit;
});

budgetSchema.index({ user: 1, category: 1, period: 1 });

module.exports = mongoose.model('Budget', budgetSchema);
