const Transaction = require('../models/Transaction');

// Linear regression to predict the next value in a series
const predictNextValue = (values) => {
  const n = values.length;
  if (n === 0) return 0;
  if (n === 1) return values[0];

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return sumY / n;
  const b = (n * sumXY - sumX * sumY) / denom;
  const a = (sumY - b * sumX) / n;
  return Math.max(0, a + b * n);
};

const round2 = (v) => Math.round(v * 100) / 100;

const getOpenRouterModels = () => {
  const configured = process.env.OPENROUTER_MODEL;
  return [
    configured,
    'deepseek/deepseek-chat:free',
    'deepseek/deepseek-r1:free',
    'deepseek/deepseek-r1-0528:free',
  ].filter(Boolean);
};

const callOpenRouterInsight = async (apiKey, data) => {
  const { predicted, trends, topCategories, monthsAnalyzed, historical } = data;

  const categoryLines = topCategories
    .map((c) => `  • ${c.category}: ETB ${c.amount.toFixed(2)}`)
    .join('\n');

  let lastError = null;

  for (const model of getOpenRouterModels()) {
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_PUBLIC_URL || 'http://localhost:5000',
          'X-Title': 'Pocket Money Forecast Assistant',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a safe personal finance assistant. Explain only the provided forecast data. Do not invent balances, bank account data, transactions, or guaranteed investment advice.',
            },
            {
              role: 'user',
              content: `Based on ${monthsAnalyzed} months of transaction history, here are the predictions for NEXT MONTH:
  • Predicted Income: ETB ${predicted.income.toFixed(2)} (trend: ${trends.income})
  • Predicted Expense: ETB ${predicted.expense.toFixed(2)} (trend: ${trends.expense})
  • Predicted Savings: ETB ${predicted.savings.toFixed(2)}

Historical averages:
  • Avg Monthly Income: ETB ${historical.avgIncome.toFixed(2)}
  • Avg Monthly Expense: ETB ${historical.avgExpense.toFixed(2)}

Top predicted expense categories next month:
${categoryLines}

Write a short, friendly 2-3 sentence financial insight. Mention the savings outlook and one safe actionable budgeting tip.`,
            },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      }
    );

    const result = await response.json();
    if (response.ok) return result?.choices?.[0]?.message?.content || null;
    lastError = result?.error?.message || `OpenRouter error: ${response.status}`;
  }

  throw new Error(lastError || 'OpenRouter insight request failed');
};

// @route GET /api/predictions
const getPredictions = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const transactions = await Transaction.find({
      user: userId,
      date: { $gte: sixMonthsAgo },
    }).sort('date');

    if (transactions.length < 3) {
      return res.json({
        success: true,
        data: {
          hasData: false,
          message: 'Add at least a few transactions over multiple days so we can start predicting your finances.',
        },
      });
    }

    // Group by year-month
    const monthlyMap = {};
    transactions.forEach((tx) => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { income: 0, expense: 0, categories: {} };
      if (tx.type === 'income') {
        monthlyMap[key].income += tx.amount;
      } else {
        monthlyMap[key].expense += tx.amount;
        monthlyMap[key].categories[tx.category] =
          (monthlyMap[key].categories[tx.category] || 0) + tx.amount;
      }
    });

    const months = Object.keys(monthlyMap).sort();
    const incomeValues = months.map((m) => monthlyMap[m].income);
    const expenseValues = months.map((m) => monthlyMap[m].expense);

    const predictedIncome = predictNextValue(incomeValues);
    const predictedExpense = predictNextValue(expenseValues);
    const predictedSavings = predictedIncome - predictedExpense;

    // Per-category predictions
    const allCategories = new Set();
    months.forEach((m) => Object.keys(monthlyMap[m].categories).forEach((c) => allCategories.add(c)));

    const categoryPredictions = {};
    allCategories.forEach((cat) => {
      const catVals = months.map((m) => monthlyMap[m].categories[cat] || 0);
      categoryPredictions[cat] = predictNextValue(catVals);
    });

    const topCategories = Object.entries(categoryPredictions)
      .filter(([, amt]) => amt > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount: round2(amount) }));

    const avgIncome = incomeValues.reduce((a, b) => a + b, 0) / incomeValues.length;
    const avgExpense = expenseValues.reduce((a, b) => a + b, 0) / expenseValues.length;

    const incomeTrend =
      incomeValues.length >= 2
        ? incomeValues[incomeValues.length - 1] >= incomeValues[0]
          ? 'increasing'
          : 'decreasing'
        : 'stable';
    const expenseTrend =
      expenseValues.length >= 2
        ? expenseValues[expenseValues.length - 1] >= expenseValues[0]
          ? 'increasing'
          : 'decreasing'
        : 'stable';

    const predictionPayload = {
      predicted: {
        income: round2(predictedIncome),
        expense: round2(predictedExpense),
        savings: round2(predictedSavings),
      },
      trends: { income: incomeTrend, expense: expenseTrend },
      topCategories,
      monthsAnalyzed: months.length,
      historical: {
        avgIncome: round2(avgIncome),
        avgExpense: round2(avgExpense),
      },
    };

    let aiInsight = null;
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (apiKey) {
      try {
        aiInsight = await callOpenRouterInsight(apiKey, predictionPayload);
      } catch (_) {
        // Prediction data still returned even without AI insight
      }
    }

    res.json({
      success: true,
      data: {
        hasData: true,
        ...predictionPayload,
        aiInsight,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPredictions };
