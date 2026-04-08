const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// @desc    Get financial summary (totals, balance)
// @route   GET /api/reports/summary
const getSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const matchStage = { user: userId };
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    const result = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
        },
      },
    ]);

    const income = result.find((r) => r._id === 'income') || { total: 0, count: 0, avgAmount: 0 };
    const expense = result.find((r) => r._id === 'expense') || { total: 0, count: 0, avgAmount: 0 };

    res.json({
      success: true,
      data: {
        totalIncome: income.total,
        totalExpense: expense.total,
        balance: income.total - expense.total,
        transactionCount: income.count + expense.count,
        incomeCount: income.count,
        expenseCount: expense.count,
        avgIncome: Math.round(income.avgAmount * 100) / 100,
        avgExpense: Math.round(expense.avgAmount * 100) / 100,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get daily report
// @route   GET /api/reports/daily
const getDailyReport = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const result = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            type: '$type',
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Group by date
    const dailyMap = {};
    result.forEach((r) => {
      if (!dailyMap[r._id.date]) {
        dailyMap[r._id.date] = { date: r._id.date, income: 0, expense: 0, transactions: 0 };
      }
      dailyMap[r._id.date][r._id.type] = r.total;
      dailyMap[r._id.date].transactions += r.count;
    });

    const daily = Object.values(dailyMap).map((d) => ({
      ...d,
      net: d.income - d.expense,
    }));

    res.json({ success: true, data: daily });
  } catch (error) {
    next(error);
  }
};

// @desc    Get weekly report
// @route   GET /api/reports/weekly
const getWeeklyReport = async (req, res, next) => {
  try {
    const { weeks = 12 } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(weeks) * 7);

    const result = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: '$date' },
            week: { $isoWeek: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]);

    const weeklyMap = {};
    result.forEach((r) => {
      const key = `${r._id.year}-W${String(r._id.week).padStart(2, '0')}`;
      if (!weeklyMap[key]) {
        weeklyMap[key] = { week: key, income: 0, expense: 0, transactions: 0 };
      }
      weeklyMap[key][r._id.type] = r.total;
      weeklyMap[key].transactions += r.count;
    });

    const weekly = Object.values(weeklyMap).map((w) => ({
      ...w,
      net: w.income - w.expense,
    }));

    res.json({ success: true, data: weekly });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly report
// @route   GET /api/reports/monthly
const getMonthlyReport = async (req, res, next) => {
  try {
    const { months = 12 } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const result = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthlyMap = {};
    result.forEach((r) => {
      const key = `${r._id.year}-${String(r._id.month).padStart(2, '0')}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = { month: key, income: 0, expense: 0, transactions: 0 };
      }
      monthlyMap[key][r._id.type] = r.total;
      monthlyMap[key].transactions += r.count;
    });

    const monthly = Object.values(monthlyMap).map((m) => ({
      ...m,
      net: m.income - m.expense,
    }));

    res.json({ success: true, data: monthly });
  } catch (error) {
    next(error);
  }
};

// @desc    Get spending by category
// @route   GET /api/reports/by-category
const getByCategory = async (req, res, next) => {
  try {
    const { startDate, endDate, type = 'expense' } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const matchStage = { user: userId, type };
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    const result = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const grandTotal = result.reduce((sum, r) => sum + r.total, 0);

    const data = result.map((r) => ({
      category: r._id,
      total: Math.round(r.total * 100) / 100,
      count: r.count,
      avgAmount: Math.round(r.avgAmount * 100) / 100,
      percentage: grandTotal > 0 ? Math.round((r.total / grandTotal) * 100) : 0,
    }));

    res.json({ success: true, data, grandTotal: Math.round(grandTotal * 100) / 100 });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary,
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  getByCategory,
};
