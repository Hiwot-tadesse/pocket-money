/**
 * Rule-based auto-categorization engine.
 * Maps transaction descriptions to predefined categories using keyword matching.
 */

const categoryRules = {
  'Food & Drinks': [
    'lunch', 'dinner', 'breakfast', 'snack', 'coffee', 'tea', 'pizza',
    'burger', 'restaurant', 'cafe', 'food', 'meal', 'drink', 'juice',
    'soda', 'candy', 'chocolate', 'ice cream', 'bakery', 'grocery',
    'supermarket', 'takeout', 'delivery', 'fast food',
  ],
  Transport: [
    'bus', 'taxi', 'uber', 'lyft', 'train', 'metro', 'subway', 'fuel',
    'gas', 'petrol', 'parking', 'toll', 'ride', 'transport', 'commute',
    'fare', 'bicycle', 'scooter',
  ],
  Entertainment: [
    'movie', 'cinema', 'game', 'gaming', 'netflix', 'spotify', 'music',
    'concert', 'show', 'theater', 'park', 'fun', 'play', 'hobby',
    'subscription', 'youtube', 'stream', 'arcade', 'bowling',
  ],
  Shopping: [
    'clothes', 'shoes', 'shirt', 'pants', 'dress', 'accessories',
    'amazon', 'online', 'mall', 'store', 'purchase', 'buy', 'shop',
    'gadget', 'electronics', 'phone', 'headphones',
  ],
  Education: [
    'book', 'school', 'tuition', 'course', 'class', 'study', 'exam',
    'stationery', 'pen', 'notebook', 'textbook', 'library', 'tutorial',
    'learning', 'education', 'university', 'college',
  ],
  Health: [
    'medicine', 'doctor', 'hospital', 'pharmacy', 'health', 'gym',
    'fitness', 'vitamin', 'dental', 'medical', 'clinic', 'wellness',
    'supplement',
  ],
  'Bills & Utilities': [
    'electricity', 'water', 'internet', 'wifi', 'phone bill', 'rent',
    'utility', 'bill', 'insurance', 'subscription', 'mobile plan',
  ],
  Gifts: [
    'gift', 'present', 'birthday', 'christmas', 'holiday', 'donation',
    'charity', 'tip',
  ],
  Savings: [
    'savings', 'save', 'deposit', 'piggy bank', 'invest', 'investment',
  ],
  Allowance: [
    'allowance', 'pocket money', 'weekly money', 'monthly money',
    'parents', 'family', 'guardian',
  ],
  'Part-time Job': [
    'salary', 'wage', 'work', 'job', 'paycheck', 'part-time',
    'babysitting', 'tutoring', 'mowing', 'chores',
  ],
  Freelance: [
    'freelance', 'gig', 'project', 'commission', 'contract', 'client',
    'side hustle',
  ],
};

/**
 * Auto-categorize a transaction based on its description.
 * @param {string} description - The transaction description
 * @param {string} type - 'income' or 'expense'
 * @returns {string} The matched category or a default category
 */
const autoCategorize = (description, type = 'expense') => {
  if (!description || typeof description !== 'string') {
    return type === 'income' ? 'Other Income' : 'Other Expense';
  }

  const lowerDesc = description.toLowerCase().trim();

  for (const [category, keywords] of Object.entries(categoryRules)) {
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword)) {
        return category;
      }
    }
  }

  return type === 'income' ? 'Other Income' : 'Other Expense';
};

/**
 * Get suggested categories for a description.
 * @param {string} description - The transaction description
 * @returns {string[]} Array of matching categories, sorted by relevance
 */
const getSuggestions = (description) => {
  if (!description || typeof description !== 'string') {
    return [];
  }

  const lowerDesc = description.toLowerCase().trim();
  const matches = [];

  for (const [category, keywords] of Object.entries(categoryRules)) {
    let matchCount = 0;
    for (const keyword of keywords) {
      if (lowerDesc.includes(keyword)) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      matches.push({ category, matchCount });
    }
  }

  matches.sort((a, b) => b.matchCount - a.matchCount);
  return matches.map((m) => m.category);
};

module.exports = { autoCategorize, getSuggestions, categoryRules };
