// Points earned for various actions
export const POINTS = {
  ADD_EXPENSE: 5,
  ADD_INCOME: 5,
  DAILY_LOGIN: 10,
  STREAK_BONUS_7: 50,
  STREAK_BONUS_14: 100,
  STREAK_BONUS_30: 250,
  FIRST_TRANSACTION: 20,
  FIRST_BUDGET: 25,
  BUDGET_UNDER_CONTROL: 30,
  REACH_10_TRANSACTIONS: 40,
  REACH_50_TRANSACTIONS: 100,
  REACH_100_TRANSACTIONS: 200,
  SET_3_BUDGETS: 50,
};

// Level thresholds
export const LEVELS = [
  { level: 1, title: 'Beginner', titleAm: 'ጀማሪ', titleOm: 'Jalqabaa', minPoints: 0, icon: 'leaf' },
  { level: 2, title: 'Saver', titleAm: 'ቆጣቢ', titleOm: 'Qusataa', minPoints: 50, icon: 'trending-up' },
  { level: 3, title: 'Tracker', titleAm: 'ተከታታይ', titleOm: 'Hordofaa', minPoints: 150, icon: 'eye' },
  { level: 4, title: 'Planner', titleAm: 'እቅድ ሰሪ', titleOm: 'Karoorsaa', minPoints: 350, icon: 'map' },
  { level: 5, title: 'Expert', titleAm: 'ባለሙያ', titleOm: 'Ogeeyyii', minPoints: 600, icon: 'ribbon' },
  { level: 6, title: 'Master', titleAm: 'ጌታ', titleOm: 'Abbaa', minPoints: 1000, icon: 'trophy' },
  { level: 7, title: 'Legend', titleAm: 'አፈ ታሪክ', titleOm: 'Seenaa', minPoints: 2000, icon: 'star' },
];

// Achievements / Badges
export const ACHIEVEMENTS = [
  {
    id: 'first_transaction',
    title: 'First Step',
    titleAm: 'የመጀመሪያ እርምጃ',
    titleOm: 'Tarkaanfii Jalqabaa',
    description: 'Add your first transaction',
    descAm: 'የመጀመሪያ ግብይትዎን ያስገቡ',
    descOm: 'Sochii jalqabaa kee galchi',
    icon: 'footsteps',
    color: '#10B981',
    condition: 'first_transaction',
  },
  {
    id: 'streak_3',
    title: '3-Day Streak',
    titleAm: 'የ3 ቀን ተከታታይ',
    titleOm: 'Itti fufiinsa Guyyaa 3',
    description: 'Log transactions 3 days in a row',
    descAm: 'ለ3 ተከታታይ ቀናት ግብይት ያስገቡ',
    descOm: 'Guyyaa 3 walitti aansitee sochii galchi',
    icon: 'flame',
    color: '#F97316',
    condition: 'streak_3',
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    titleAm: 'የሳምንት ተዋጊ',
    titleOm: 'Lolaa Torbanii',
    description: 'Log transactions 7 days in a row',
    descAm: 'ለ7 ተከታታይ ቀናት ግብይት ያስገቡ',
    descOm: 'Guyyaa 7 walitti aansitee sochii galchi',
    icon: 'flame',
    color: '#EF4444',
    condition: 'streak_7',
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    titleAm: 'የወር ጌታ',
    titleOm: 'Abbaa Ji\'aa',
    description: 'Log transactions 30 days in a row',
    descAm: 'ለ30 ተከታታይ ቀናት ግብይት ያስገቡ',
    descOm: 'Guyyaa 30 walitti aansitee sochii galchi',
    icon: 'diamond',
    color: '#8B5CF6',
    condition: 'streak_30',
  },
  {
    id: 'budget_hero',
    title: 'Budget Hero',
    titleAm: 'የበጀት ጀግና',
    titleOm: 'Gootaa Bajataa',
    description: 'Stay under budget for a full period',
    descAm: 'ለሙሉ ጊዜ ከበጀት በታች ይቆዩ',
    descOm: 'Yeroo guutuu bajata gadi ta\'i',
    icon: 'shield-checkmark',
    color: '#3B82F6',
    condition: 'budget_under_control',
  },
  {
    id: 'ten_transactions',
    title: 'Getting Started',
    titleAm: 'መጀመር',
    titleOm: 'Jalqabuu',
    description: 'Reach 10 total transactions',
    descAm: '10 ግብይቶች ያሳኩ',
    descOm: 'Sochii 10 gahi',
    icon: 'checkmark-done',
    color: '#06B6D4',
    condition: 'reach_10_transactions',
  },
  {
    id: 'fifty_transactions',
    title: 'Dedicated Tracker',
    titleAm: 'ቁርጠኛ ተከታታይ',
    titleOm: 'Hordofaa Cimaa',
    description: 'Reach 50 total transactions',
    descAm: '50 ግብይቶች ያሳኩ',
    descOm: 'Sochii 50 gahi',
    icon: 'medal',
    color: '#F59E0B',
    condition: 'reach_50_transactions',
  },
  {
    id: 'first_budget',
    title: 'Budget Setter',
    titleAm: 'በጀት አዋቂ',
    titleOm: 'Qopheessaa Bajataa',
    description: 'Create your first budget',
    descAm: 'የመጀመሪያ በጀትዎን ይፍጠሩ',
    descOm: 'Bajata jalqabaa kee uumi',
    icon: 'pie-chart',
    color: '#EC4899',
    condition: 'first_budget',
  },
  {
    id: 'saver_100',
    title: 'Smart Saver',
    titleAm: 'ብልጥ ቆጣቢ',
    titleOm: 'Qusataa Cimaa',
    description: 'Save a total of 100 ETB income',
    descAm: 'ጠቅላላ 100 ብር ገቢ ያስገቡ',
    descOm: 'Walitti ida\'ama galii ETB 100 gahi',
    icon: 'wallet',
    color: '#22C55E',
    condition: 'saver_100',
  },
];

export const getLevelForPoints = (points) => {
  let currentLevel = LEVELS[0];
  for (const level of LEVELS) {
    if (points >= level.minPoints) {
      currentLevel = level;
    } else {
      break;
    }
  }
  return currentLevel;
};

export const getNextLevel = (points) => {
  for (const level of LEVELS) {
    if (points < level.minPoints) {
      return level;
    }
  }
  return null;
};

export const getLevelProgress = (points) => {
  const current = getLevelForPoints(points);
  const next = getNextLevel(points);
  if (!next) return 1;
  const range = next.minPoints - current.minPoints;
  const progress = points - current.minPoints;
  return range > 0 ? progress / range : 1;
};
