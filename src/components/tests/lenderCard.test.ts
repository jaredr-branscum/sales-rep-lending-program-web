import { describe, it, expect } from 'vitest';
import { isUpdatedInLast30Days, isUpdatedInLastMonth, formatCurrencyAmount } from '../LenderCard';

describe('LenderCard - isUpdatedInLast30Days & formatCurrencyAmount', () => {
  describe('isUpdatedInLast30Days', () => {
    it('returns true when program date is 30 days or less older from current date', () => {
      const currentDate = new Date('2026-09-27');
      expect(isUpdatedInLast30Days('9/27/2026', currentDate)).toBe(true);
      expect(isUpdatedInLast30Days('9/15/2026', currentDate)).toBe(true);
      expect(isUpdatedInLast30Days('8/29/2026', currentDate)).toBe(true);
      // Backward-compatible alias
      expect(isUpdatedInLastMonth('9/15/2026', currentDate)).toBe(true);
    });

    it('returns false when program date is older than 30 days from current date', () => {
      const currentDate = new Date('2026-09-27');
      expect(isUpdatedInLast30Days('8/27/2026', currentDate)).toBe(false);
      expect(isUpdatedInLast30Days('4/16/2026', currentDate)).toBe(false);
      expect(isUpdatedInLast30Days('2/3/2026', currentDate)).toBe(false);
    });

    it('returns false when date is missing, undefined, or invalid', () => {
      const currentDate = new Date('2026-09-27');
      expect(isUpdatedInLast30Days(undefined, currentDate)).toBe(false);
      expect(isUpdatedInLast30Days('', currentDate)).toBe(false);
      expect(isUpdatedInLast30Days('invalid-date', currentDate)).toBe(false);
    });

    it('gracefully uses real current date when currentDate is omitted', () => {
      const now = new Date();
      const todayStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
      expect(isUpdatedInLast30Days(todayStr)).toBe(true);
      expect(isUpdatedInLast30Days('1/1/2000')).toBe(false);
    });
  });

  describe('formatCurrencyAmount', () => {
    it('formats millions and thousands with clean suffixes', () => {
      expect(formatCurrencyAmount(5000000)).toBe('$5M');
      expect(formatCurrencyAmount(1500000)).toBe('$1.5M');
      expect(formatCurrencyAmount(350000)).toBe('$350k');
      expect(formatCurrencyAmount(25000)).toBe('$25k');
      expect(formatCurrencyAmount(500)).toBe('$500');
    });
  });
});
