const { autoCategorize } = require('./categorizer');

const parseAmountCandidate = (raw) => {
  if (!raw) return null;
  let cleaned = String(raw).replace(/[^0-9.,]/g, '');
  if (!cleaned) return null;
  if (cleaned.includes(',') && !cleaned.includes('.')) {
    cleaned = cleaned.replace(',', '.');
  } else {
    cleaned = cleaned.replace(/,/g, '');
  }
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  if (value <= 0 || value > 1000000) return null;
  return value;
};

const extractAmounts = (line) => {
  if (!line) return [];
  const matches = line.match(/\d{1,3}(?:[ ,]\d{3})*(?:[.,]\d{2})|\d+(?:[.,]\d{2})|\d+\.\d+/g) || [];
  return matches
    .map(parseAmountCandidate)
    .filter((value) => Number.isFinite(value));
};

const extractAmount = (text) => {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const keywordLines = lines.filter((line) => /total|amount|balance|grand|subtotal|due/i.test(line));
  const prioritized = keywordLines.flatMap(extractAmounts);
  if (prioritized.length > 0) {
    return Math.max(...prioritized);
  }
  const all = lines.flatMap(extractAmounts);
  if (all.length === 0) return null;
  return Math.max(...all);
};

const extractDate = (text) => {
  const patterns = [
    /(\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/,
    /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/,
    /([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{2,4})/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const parsed = new Date(match[1]);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
      }
    }
  }
  return null;
};

const extractStoreName = (text) => {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  return lines.find((line) => /[A-Za-z]/.test(line) && line.length >= 3) || null;
};

const extractReceiptData = (rawText = '') => {
  const text = String(rawText || '').trim();
  const storeName = extractStoreName(text);
  const amount = extractAmount(text);
  const date = extractDate(text);
  const category = autoCategorize(`${storeName || ''} ${text}`.trim(), 'expense');

  return {
    storeName,
    amount,
    date,
    category,
  };
};

module.exports = { extractReceiptData };
