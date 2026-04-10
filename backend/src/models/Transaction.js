const mongoose = require('mongoose');

const CATEGORIES = [
  'Food & Drinks',
  'Transport',
  'Entertainment',
  'Shopping',
  'Education',
  'Health',
  'Bills & Utilities',
  'Gifts',
  'Savings',
  // Income sources
  'Salary',
  'Allowance',
  'Family Support',
  'NGO/Grant',
  'Bank Loan',
  'Part-time Job',
  'Freelance',
  'Other Income',
  'Other Expense',
];

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: [true, 'Category is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringInterval: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'one-time', 'custom', null],
      default: null,
    },
    recurringCustomLabel: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
module.exports.CATEGORIES = CATEGORIES;
