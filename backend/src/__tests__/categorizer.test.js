const { autoCategorize, getSuggestions } = require('../utils/categorizer');

describe('Auto-Categorizer', () => {
  describe('autoCategorize', () => {
    test('should categorize food-related descriptions', () => {
      expect(autoCategorize('Lunch at cafe', 'expense')).toBe('Food & Drinks');
      expect(autoCategorize('Morning coffee', 'expense')).toBe('Food & Drinks');
      expect(autoCategorize('Pizza delivery', 'expense')).toBe('Food & Drinks');
    });

    test('should categorize transport-related descriptions', () => {
      expect(autoCategorize('Bus fare to school', 'expense')).toBe('Transport');
      expect(autoCategorize('Uber ride home', 'expense')).toBe('Transport');
    });

    test('should categorize entertainment-related descriptions', () => {
      expect(autoCategorize('Movie tickets', 'expense')).toBe('Entertainment');
      expect(autoCategorize('Netflix subscription', 'expense')).toBe('Entertainment');
    });

    test('should categorize education-related descriptions', () => {
      expect(autoCategorize('New textbook', 'expense')).toBe('Education');
      expect(autoCategorize('School stationery', 'expense')).toBe('Education');
    });

    test('should categorize income descriptions', () => {
      expect(autoCategorize('Weekly allowance', 'income')).toBe('Allowance');
      expect(autoCategorize('Babysitting job', 'income')).toBe('Part-time Job');
      expect(autoCategorize('Freelance project payment', 'income')).toBe('Freelance');
    });

    test('should return default category for unrecognized descriptions', () => {
      expect(autoCategorize('Random thing', 'expense')).toBe('Other Expense');
      expect(autoCategorize('Random thing', 'income')).toBe('Other Income');
    });

    test('should handle empty or null descriptions', () => {
      expect(autoCategorize('', 'expense')).toBe('Other Expense');
      expect(autoCategorize(null, 'income')).toBe('Other Income');
      expect(autoCategorize(undefined, 'expense')).toBe('Other Expense');
    });

    test('should be case-insensitive', () => {
      expect(autoCategorize('LUNCH AT RESTAURANT', 'expense')).toBe('Food & Drinks');
      expect(autoCategorize('BUS Fare', 'expense')).toBe('Transport');
    });
  });

  describe('getSuggestions', () => {
    test('should return matching categories sorted by relevance', () => {
      const suggestions = getSuggestions('grocery store food');
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0]).toBe('Food & Drinks');
    });

    test('should return empty array for unrecognized descriptions', () => {
      expect(getSuggestions('xyzabc123')).toEqual([]);
    });

    test('should handle empty input', () => {
      expect(getSuggestions('')).toEqual([]);
      expect(getSuggestions(null)).toEqual([]);
    });
  });
});
