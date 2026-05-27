const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');

const buildSystemPrompt = ({ income, expenses, budgets, goals, recentTx }) => {
  const net = income - expenses;
  const savingsRate = income > 0 ? ((net / income) * 100).toFixed(1) : 0;

  const budgetLines = budgets.length
    ? budgets.map((b) => `  • ${b.category}: ETB ${b.spent.toFixed(2)} / ETB ${b.limit.toFixed(2)} (${b.limit > 0 ? ((b.spent / b.limit) * 100).toFixed(0) : 0}% used)`).join('\n')
    : '  • No active budgets';

  const goalLines = goals.length
    ? goals.map((g) => `  • ${g.title}: ETB ${g.currentAmount.toFixed(2)} / ETB ${g.targetAmount.toFixed(2)} (${((g.currentAmount / g.targetAmount) * 100).toFixed(0)}% reached)`).join('\n')
    : '  • No savings goals yet';

  const txLines = recentTx.length
    ? recentTx.map((t) => `  • ${t.type === 'income' ? '+' : '-'}ETB ${t.amount.toFixed(2)} | ${t.category} | ${new Date(t.date).toLocaleDateString()}`).join('\n')
    : '  • No recent transactions';

  return `You are a friendly and knowledgeable personal finance assistant inside a pocket money tracker app.
The app is used primarily by Ethiopian students and young adults. Currency is ETB (Ethiopian Birr).

USER'S FINANCIAL SUMMARY (current month):
  • Total Income:  ETB ${income.toFixed(2)}
  • Total Expenses: ETB ${expenses.toFixed(2)}
  • Net Savings:   ETB ${net.toFixed(2)}
  • Savings Rate:  ${savingsRate}%

ACTIVE BUDGETS:
${budgetLines}

SAVINGS GOALS:
${goalLines}

RECENT TRANSACTIONS (last 5):
${txLines}

RULES:
- Be warm, concise and practical (2–4 sentences max per reply)
- Always reference ETB for amounts
- Use the user's real data above when giving advice
- If a question is completely unrelated to money/finance, politely redirect
- Encourage good saving habits and celebrate progress`;
};

const normalizeHistory = (history = []) => {
  return history
    .filter((item) => item?.content || item?.text)
    .slice(-14)
    .map((item) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: item.content || item.text,
    }));
};

const getOpenRouterModels = async () => {
  const configured = process.env.OPENROUTER_MODEL;
  const fallbackModels = [
    configured,
    'deepseek/deepseek-chat-v3-0324:free',
    'deepseek/deepseek-chat:free',
    'deepseek/deepseek-r1:free',
    'deepseek/deepseek-r1-0528:free',
  ].filter(Boolean);

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models');
    const result = await response.json();
    const liveDeepSeekFreeModels = (result?.data || [])
      .map((model) => model.id)
      .filter((id) => id?.startsWith('deepseek/') && id.endsWith(':free'));
    return [...new Set([...fallbackModels, ...liveDeepSeekFreeModels])];
  } catch (_) {
    return [...new Set(fallbackModels)];
  }
};

const callOpenRouter = async (systemPrompt, history, userMessage) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set on the server');

  let lastError = null;

  for (const model of await getOpenRouterModels()) {
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.APP_PUBLIC_URL || 'http://localhost:5000',
          'X-Title': 'Pocket Money Finance Assistant',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: `${systemPrompt}

SAFETY RULES:
- Help users manage budgets, understand expenses, and learn financial concepts clearly.
- Do not invent balances, transactions, budgets, or goals. Only use the data provided in the system context.
- Do not claim access to bank accounts, cards, mobile money, or external financial accounts.
- Do not give unsafe investment advice, guaranteed returns, or high-risk recommendations.
- If data is missing, say what information is needed instead of guessing.`,
            },
            ...normalizeHistory(history),
            { role: 'user', content: userMessage },
          ],
          max_tokens: 512,
          temperature: 0.7,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      const text = data?.choices?.[0]?.message?.content;
      if (!text) throw new Error('Empty response from OpenRouter');
      return text;
    }

    lastError = data?.error?.message || `OpenRouter API error: ${response.status}`;
  }

  throw new Error(lastError || 'OpenRouter request failed');
};

// @route POST /api/chat
const chat = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const userId = req.user._id;
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [incomeAgg, expenseAgg, budgets, goals, recentTx] = await Promise.all([
      Transaction.aggregate([
        { $match: { user: userId, type: 'income', date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { user: userId, type: 'expense', date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Budget.find({ user: userId, isActive: true }).limit(10),
      Goal.find({ user: userId }).limit(6),
      Transaction.find({ user: userId }).sort('-date').limit(5),
    ]);

    const financialContext = {
      income: incomeAgg[0]?.total || 0,
      expenses: expenseAgg[0]?.total || 0,
      budgets,
      goals,
      recentTx,
    };

    const systemPrompt = buildSystemPrompt(financialContext);
    const reply = await callOpenRouter(systemPrompt, history, message.trim());

    res.json({ success: true, data: { reply } });
  } catch (error) {
    next(error);
  }
};

module.exports = { chat };
