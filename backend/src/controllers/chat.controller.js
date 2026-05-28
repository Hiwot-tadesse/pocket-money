const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const getOpenRouterModels = () => {
  const configured = process.env.OPENROUTER_MODEL;
  return [
    configured,
    'deepseek/deepseek-chat:free',
    'deepseek/deepseek-r1:free',
    'deepseek/deepseek-r1-0528:free',
    'mistralai/mistral-7b-instruct:free',
    'meta-llama/llama-3.3-8b-instruct:free',
    'qwen/qwen-2.5-7b-instruct:free',
  ].filter(Boolean);
};

const getLiveFallbackModels = async () => {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models');
    if (!response.ok) return [];
    const result = await response.json();
    return (result?.data || [])
      .map((model) => model?.id)
      .filter((id) => typeof id === 'string' && id.endsWith(':free'))
      .slice(0, 30);
  } catch (_) {
    return [];
  }
};

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

const readJsonSafely = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('[Chat] Failed to parse OpenRouter response JSON:', error.message);
    return { raw: text };
  }
};

const getClientErrorMessage = (status, providerMessage) => {
  if (status === 401 || status === 403) {
    return 'The AI service is not configured correctly. Please check the server OpenRouter API key.';
  }
  if (status === 404) {
    return 'The AI model is not available right now. Please try again or change the configured model.';
  }
  if (status === 429) {
    return 'The AI service is busy or rate-limited right now. Please wait a moment and try again.';
  }
  if (status >= 500) {
    return 'The AI service is temporarily unavailable. Please try again shortly.';
  }
  return providerMessage || 'The AI service could not answer right now. Please try again.';
};

const callOpenRouter = async (systemPrompt, history, userMessage) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    const error = new Error('OPENROUTER_API_KEY is not set on the server');
    error.statusCode = 503;
    throw error;
  }

  let lastProviderMessage = null;
  let lastStatus = 502;

  const modelsToTry = [...new Set([...getOpenRouterModels(), ...(await getLiveFallbackModels())])];

  for (const model of modelsToTry) {
    const response = await fetch(OPENROUTER_URL, {
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
    });

    const data = await readJsonSafely(response);

    if (!response.ok) {
      const providerMessage = data?.error?.message || data?.message || data?.raw;
      lastProviderMessage = providerMessage;
      lastStatus = response.status;
      console.error('[Chat] OpenRouter request failed:', {
        status: response.status,
        model,
        message: providerMessage,
      });

      // Try the next model when the chosen model is unavailable.
      if (response.status === 404 && typeof providerMessage === 'string' && providerMessage.toLowerCase().includes('no endpoints')) {
        continue;
      }

      const error = new Error(getClientErrorMessage(response.status, providerMessage));
      error.statusCode = response.status;
      throw error;
    }

    const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text;
    if (!text?.trim()) {
      console.error('[Chat] OpenRouter returned an empty reply:', {
        model,
        responseKeys: Object.keys(data || {}),
      });
      const error = new Error('The AI service returned a blank response. Please try again.');
      error.statusCode = 502;
      throw error;
    }

    return text.trim();
  }

  const error = new Error(getClientErrorMessage(lastStatus, lastProviderMessage));
  error.statusCode = lastStatus || 502;
  throw error;
};

// @route POST /api/chat
const chat = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    console.log('[Chat] Request received:', {
      userId: req.user?._id?.toString(),
      messageLength: message.trim().length,
      historyLength: Array.isArray(history) ? history.length : 0,
    });

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
    if (error.statusCode) res.status(error.statusCode);
    console.error('[Chat] Request failed:', error.message);
    next(error);
  }
};

module.exports = { chat };
