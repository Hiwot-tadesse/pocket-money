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

module.exports = {
  checkBudgetThresholds,
  checkInactivity,
  BUDGET_WARNING_THRESHOLD,
  INACTIVITY_DAYS,
};
