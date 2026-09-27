import { describe, it, expect } from 'vitest';
import { isUpdatedInLastMonth, formatCurrencyAmount } from '../LenderCard';

describe('LenderCard - isUpdatedInLastMonth & formatCurrencyAmount', () => {
  describe('isUpdatedInLastMonth', () => {
    it('returns true when program date is in the same month and year as the reference date', () => {
      const refDate = new Date('2026-04-28');
      expect(isUpdatedInLastMonth('4/16/2026', refDate)).toBe(true);
      expect(isUpdatedInLastMonth('4/1/2026', refDate)).toBe(true);
      expect(isUpdatedInLastMonth('2026-04-10', refDate)).toBe(true);
    });

    it('returns true when program date is within 30 days of the reference date across month boundaries', () => {
      const refDate = new Date('2026-05-05');
      // 2026-04-20 is 15 days earlier
      expect(isUpdatedInLastMonth('4/20/2026', refDate)).toBe(true);
    });

    it('returns false when program date is from an older month outside the 30-day window', () => {
      const refDate = new Date('2026-04-28');
      expect(isUpdatedInLastMonth('1/16/2026', refDate)).toBe(false);
      expect(isUpdatedInLastMonth('2/3/2026', refDate)).toBe(false);
      expect(isUpdatedInLastMonth('3/1/2026', refDate)).toBe(false);
    });

    it('returns false when date is missing, undefined, or invalid', () => {
      const refDate = new Date('2026-04-28');
      expect(isUpdatedInLastMonth(undefined, refDate)).toBe(false);
      expect(isUpdatedInLastMonth('', refDate)).toBe(false);
      expect(isUpdatedInLastMonth('invalid-date', refDate)).toBe(false);
    });

    it('gracefully uses current date when referenceDate is omitted', () => {
      const now = new Date();
      const thisMonthDate = `${now.getMonth() + 1}/15/${now.getFullYear()}`;
      expect(isUpdatedInLastMonth(thisMonthDate)).toBe(true);
      expect(isUpdatedInLastMonth('1/1/2000')).toBe(false);
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
