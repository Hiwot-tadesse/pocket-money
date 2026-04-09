export const COLORS = {
  primary: '#4338CA', // Deeper indigo
  primaryLight: '#818CF8',
  primaryDark: '#312E81',
  secondary: '#38BDF8', // Cyan
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  income: '#10B981', // Emerald
  expense: '#EF4444', // Red

  white: '#FFFFFF',
  black: '#000000',
  background: '#F3F4F6', // Slightly darker soft gray for contrast
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E5E7EB',
  divider: '#F3F4F6',

  text: '#111827', // Darker text
  textSecondary: '#4B5563',
  textLight: '#9CA3AF',
  placeholder: '#9CA3AF',
  
  // Custom glass/overlay
  overlay: 'rgba(0,0,0,0.4)',
  glass: 'rgba(255,255,255,0.9)',
};

export const SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  title: 28,

  borderRadius: 16,
  borderRadiusSm: 12,
  borderRadiusLg: 24,

  padding: 16,
  paddingSm: 12,
  paddingLg: 24,
  margin: 16,
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const CATEGORIES = {
  'Food & Drinks': { icon: 'fast-food', color: '#F97316' },
  Transport: { icon: 'bus', color: '#3B82F6' },
  Entertainment: { icon: 'game-controller', color: '#8B5CF6' },
  Shopping: { icon: 'cart', color: '#EC4899' },
  Education: { icon: 'book', color: '#06B6D4' },
  Health: { icon: 'heart', color: '#EF4444' },
  'Bills & Utilities': { icon: 'flash', color: '#F59E0B' },
  Gifts: { icon: 'gift', color: '#D946EF' },
  Savings: { icon: 'wallet', color: '#10B981' },
  Allowance: { icon: 'cash', color: '#22C55E' },
  'Part-time Job': { icon: 'briefcase', color: '#6366F1' },
  Freelance: { icon: 'laptop', color: '#14B8A6' },
  'Other Income': { icon: 'add-circle', color: '#84CC16' },
  'Other Expense': { icon: 'remove-circle', color: '#78716C' },
};
