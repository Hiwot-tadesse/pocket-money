const { validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { autoCategorize, getSuggestions } = require('../utils/categorizer');
const { checkBudgetThresholds, checkSavingsAlert } = require('../utils/alertEngine');

// @desc    Create a new transaction
// @route   POST /api/transactions
const createTransaction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    let { type, amount, category, description, date, tags, isRecurring, recurringInterval, recurringCustomLabel } = req.body;

    // Auto-categorize if no category provided
    if (!category && description) {
      category = autoCategorize(description, type);
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      amount,
      category,
      description,
      date: date || Date.now(),
      tags: tags || [],
      isRecurring: isRecurring || false,
      recurringInterval: recurringInterval || null,
      recurringCustomLabel: recurringCustomLabel || null,
    });

    // Update budget spent amount if it's an expense
    if (type === 'expense') {
      await Budget.updateMany(
        { user: req.user._id, category, isActive: true },
        { $inc: { spent: amount } }
      );
      await checkBudgetThresholds(req.user._id, transaction);
    }
    // Check savings ratio after every transaction
    await checkSavingsAlert(req.user._id);

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all transactions for the user
// @route   GET /api/transactions
const getTransactions = async (req, res, next) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sort = '-date',
    } = req.query;

    const filter = { user: req.user._id };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: transactions,
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

// @desc    Get a single transaction
// @route   GET /api/transactions/:id
const getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
const updateTransaction = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const existing = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // If expense amount changed, update budget accordingly
    if (existing.type === 'expense') {
      await Budget.updateMany(
        { user: req.user._id, category: existing.category, isActive: true },
        { $inc: { spent: -existing.amount } }
      );
    }

    const { type, amount, category, description, date, tags, isRecurring, recurringInterval } = req.body;

    const updates = {};
    if (type) updates.type = type;
    if (amount) updates.amount = amount;
    if (category) updates.category = category;
    if (description !== undefined) updates.description = description;
    if (date) updates.date = date;
    if (tags) updates.tags = tags;
    if (typeof isRecurring === 'boolean') updates.isRecurring = isRecurring;
    if (recurringInterval !== undefined) updates.recurringInterval = recurringInterval;

    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    // Re-add budget amount for updated expense
    const updatedType = type || existing.type;
    const updatedAmount = amount || existing.amount;
    const updatedCategory = category || existing.category;

    if (updatedType === 'expense') {
      await Budget.updateMany(
        { user: req.user._id, category: updatedCategory, isActive: true },
        { $inc: { spent: updatedAmount } }
      );
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Reverse budget impact
    if (transaction.type === 'expense') {
      await Budget.updateMany(
        { user: req.user._id, category: transaction.category, isActive: true },
        { $inc: { spent: -transaction.amount } }
      );
    }

    await Transaction.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category suggestions for a description
// @route   GET /api/transactions/suggest-category
const suggestCategory = async (req, res, next) => {
  try {
    const { description, type } = req.query;

    if (!description) {
      return res.status(400).json({
        success: false,
        message: 'Description is required',
      });
    }

    const suggestions = getSuggestions(description);
    const autoCategory = autoCategorize(description, type || 'expense');

    res.json({
      success: true,
      data: {
        suggested: autoCategory,
        alternatives: suggestions,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  suggestCategory,
};
