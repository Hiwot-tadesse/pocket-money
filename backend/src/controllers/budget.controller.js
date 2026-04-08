const { validationResult } = require('express-validator');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

// @desc    Create a new budget
// @route   POST /api/budgets
const createBudget = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { category, limit, period, startDate, endDate } = req.body;

    // Check for existing active budget with same category and period
    const existing = await Budget.findOne({
      user: req.user._id,
      category,
      period,
      isActive: true,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Active ${period} budget for ${category} already exists`,
      });
    }

    // Calculate current spent amount for this period
    const periodStart = getPeriodStart(period, startDate);
    const currentSpent = await calculateSpent(req.user._id, category, periodStart);

    const budget = await Budget.create({
      user: req.user._id,
      category,
      limit,
      period,
      spent: currentSpent,
      startDate: periodStart,
      endDate,
    });

    res.status(201).json({
      success: true,
      data: budget,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all budgets for the user
// @route   GET /api/budgets
const getBudgets = async (req, res, next) => {
  try {
    const { active } = req.query;
    const filter = { user: req.user._id };

    if (active !== undefined) {
      filter.isActive = active === 'true';
    }

    const budgets = await Budget.find(filter).sort({ createdAt: -1 });

    // Compute summary
    const totalBudget = budgets
      .filter((b) => b.isActive)
      .reduce((sum, b) => sum + b.limit, 0);
    const totalSpent = budgets
      .filter((b) => b.isActive)
      .reduce((sum, b) => sum + b.spent, 0);

    res.json({
      success: true,
      data: budgets,
      summary: {
        totalBudget,
        totalSpent,
        totalRemaining: Math.max(0, totalBudget - totalSpent),
        overallPercentage: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single budget
// @route   GET /api/budgets/:id
const getBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    res.json({ success: true, data: budget });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a budget
// @route   PUT /api/budgets/:id
const updateBudget = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    const { limit, period, isActive } = req.body;
    if (limit) budget.limit = limit;
    if (period) budget.period = period;
    if (typeof isActive === 'boolean') budget.isActive = isActive;

    await budget.save();

    res.json({ success: true, data: budget });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found',
      });
    }

    res.json({
      success: true,
      message: 'Budget deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset budget spent amounts (for period rollover)
// @route   POST /api/budgets/reset
const resetBudgets = async (req, res, next) => {
  try {
    const budgets = await Budget.find({ user: req.user._id, isActive: true });

    for (const budget of budgets) {
      const periodStart = getPeriodStart(budget.period);
      const currentSpent = await calculateSpent(req.user._id, budget.category, periodStart);
      budget.spent = currentSpent;
      budget.startDate = periodStart;
      await budget.save();
    }

    res.json({
      success: true,
      message: 'Budgets recalculated successfully',
      data: budgets,
    });
  } catch (error) {
    next(error);
  }
};

// Helper: Calculate spent amount for a category within a period
const calculateSpent = async (userId, category, startDate) => {
  const result = await Transaction.aggregate([
    {
      $match: {
        user: userId,
        type: 'expense',
        category,
        date: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  return result.length > 0 ? result[0].total : 0;
};

// Helper: Get the start date for a budget period
const getPeriodStart = (period, referenceDate) => {
  const now = referenceDate ? new Date(referenceDate) : new Date();
  switch (period) {
    case 'daily':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case 'weekly': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(now.getFullYear(), now.getMonth(), diff);
    }
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1);
  }
};

module.exports = {
  createBudget,
  getBudgets,
  getBudget,
  updateBudget,
  deleteBudget,
  resetBudgets,
};
