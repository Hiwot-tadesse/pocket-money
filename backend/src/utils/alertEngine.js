/**
 * Event-driven alert engine.
 * Triggers notifications based on threshold conditions.
 */

const Alert = require('../models/Alert');
const Budget = require('../models/Budget');

const BUDGET_WARNING_THRESHOLD = 80; // 80% of budget
const INACTIVITY_DAYS = 7; // Days of inactivity before alert

/**
 * Check budget thresholds after a transaction and create alerts if needed.
 * @param {string} userId - The user's ID
 * @param {Object} transaction - The transaction object
 */
const checkBudgetThresholds = async (userId, transaction) => {
  if (transaction.type !== 'expense') return;

  try {
    const budgets = await Budget.find({
      user: userId,
      isActive: true,
      category: transaction.category,
    });

    for (const budget of budgets) {
      const percentUsed = (budget.spent / budget.limit) * 100;

      if (percentUsed >= 100) {
        // Budget exceeded
        const existingAlert = await Alert.findOne({
          user: userId,
          relatedBudget: budget._id,
          type: 'budget_exceeded',
          createdAt: { $gte: getStartOfPeriod(budget.period) },
        });

        if (!existingAlert) {
          await Alert.create({
            user: userId,
            type: 'budget_exceeded',
            title: 'Budget Exceeded!',
            message: `You have exceeded your ${budget.period} budget for ${budget.category}. Spent: $${budget.spent.toFixed(2)} / Limit: $${budget.limit.toFixed(2)}`,
            relatedBudget: budget._id,
            relatedTransaction: transaction._id,
            threshold: 100,
          });
        }
      } else if (percentUsed >= BUDGET_WARNING_THRESHOLD) {
        // Budget warning
        const existingAlert = await Alert.findOne({
          user: userId,
          relatedBudget: budget._id,
          type: 'budget_warning',
          createdAt: { $gte: getStartOfPeriod(budget.period) },
        });

        if (!existingAlert) {
          await Alert.create({
            user: userId,
            type: 'budget_warning',
            title: 'Budget Warning',
            message: `You have used ${percentUsed.toFixed(0)}% of your ${budget.period} budget for ${budget.category}. Spent: $${budget.spent.toFixed(2)} / Limit: $${budget.limit.toFixed(2)}`,
            relatedBudget: budget._id,
            relatedTransaction: transaction._id,
            threshold: BUDGET_WARNING_THRESHOLD,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error checking budget thresholds:', error.message);
  }
};

/**
 * Check for user inactivity and create alerts.
 * @param {string} userId - The user's ID
 * @param {Date} lastActivityDate - The date of the last transaction
 */
const checkInactivity = async (userId, lastActivityDate) => {
  try {
    if (!lastActivityDate) return;

    const daysSinceLastActivity = Math.floor(
      (Date.now() - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceLastActivity >= INACTIVITY_DAYS) {
      const existingAlert = await Alert.findOne({
        user: userId,
        type: 'inactivity',
        createdAt: {
          $gte: new Date(Date.now() - INACTIVITY_DAYS * 24 * 60 * 60 * 1000),
        },
      });

      if (!existingAlert) {
        await Alert.create({
          user: userId,
          type: 'inactivity',
          title: 'We miss you!',
          message: `You haven't recorded any transactions in ${daysSinceLastActivity} days. Keep tracking your pocket money!`,
        });
      }
    }
  } catch (error) {
    console.error('Error checking inactivity:', error.message);
  }
};

/**
 * Get the start of the current period for deduplication.
 */
const getStartOfPeriod = (period) => {
  const now = new Date();
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

/**
 * Check income vs expense ratio and alert when spending is too high.
 * @param {ObjectId} userId
 */
const checkSavingsAlert = async (userId) => {
  try {
    const Transaction = require('../models/Transaction');
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [incomeResult, expenseResult] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: userId, type: 'income', date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { user: userId, type: 'expense', date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalIncome = incomeResult[0]?.total || 0;
    const totalExpenses = expenseResult[0]?.total || 0;

    if (totalIncome === 0) return;

    const ratio = (totalExpenses / totalIncome) * 100;

    if (ratio >= 90) {
      const existing = await Alert.findOne({
        user: userId,
        type: 'savings_critical',
        createdAt: { $gte: startOfMonth },
      });
      if (!existing) {
        await Alert.create({
          user: userId,
          type: 'savings_critical',
          title: 'Almost Out of Money!',
          message: `You have spent ${ratio.toFixed(0)}% of this month's income (ETB ${totalExpenses.toFixed(2)} of ETB ${totalIncome.toFixed(2)}). Reduce spending and try to save more.`,
          threshold: 90,
        });
      }
    } else if (ratio >= 70) {
      const existing = await Alert.findOne({
        user: userId,
        type: 'savings_warning',
        createdAt: { $gte: startOfMonth },
      });
      if (!existing) {
        await Alert.create({
          user: userId,
          type: 'savings_warning',
          title: 'Save More This Month',
          message: `You have spent ${ratio.toFixed(0)}% of this month's income (ETB ${totalExpenses.toFixed(2)} of ETB ${totalIncome.toFixed(2)}). Aim to save at least 30% each month.`,
          threshold: 70,
        });
      }
    }
  } catch (error) {
    console.error('Error checking savings alert:', error.message);
  }
};

module.exports = {
  checkBudgetThresholds,
  checkInactivity,
  checkSavingsAlert,
  BUDGET_WARNING_THRESHOLD,
  INACTIVITY_DAYS,
};
