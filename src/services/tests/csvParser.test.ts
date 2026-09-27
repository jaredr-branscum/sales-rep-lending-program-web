import { describe, it, expect } from 'vitest';
import {
  parseLenderCSV,
  parseLenderCSVWithReport,
  safeParseNumeric,
  safeParseNullableNumeric,
  parseCSVLine,
  DEFAULT_LENDER_PROGRAMS,
} from '../csvParser';

describe('csvParser - Error Handling & Boundary Cases', () => {
  describe('Input boundary handling', () => {
    it('returns empty array when input is empty string', () => {
      expect(parseLenderCSV('')).toEqual([]);
      const report = parseLenderCSVWithReport('');
      expect(report.programs).toEqual([]);
      expect(report.warnings).toHaveLength(1);
    });

    it('returns empty array when input is whitespace only', () => {
      expect(parseLenderCSV('   \n  \t  ')).toEqual([]);
    });

    it('handles null, undefined, or non-string inputs safely without throwing', () => {
      expect(parseLenderCSV(null)).toEqual([]);
      expect(parseLenderCSV(undefined)).toEqual([]);
      expect(parseLenderCSV(12345)).toEqual([]);
      expect(parseLenderCSV({ notAString: true })).toEqual([]);
    });

    it('handles header-only CSV gracefully', () => {
      const headerOnly = 'lender_name,program_type,min_loan_amount,max_loan_amount';
      const report = parseLenderCSVWithReport(headerOnly);
      expect(report.programs).toEqual([]);
      expect(report.warnings[0]).toContain('only a header or no data rows');
    });
  });

  describe('Numeric sanitization and fallbacks', () => {
    it('safeParseNumeric handles corrupted formats and fallback defaults', () => {
      expect(safeParseNumeric('1000')).toBe(1000);
      expect(safeParseNumeric('$250,000')).toBe(250000);
      expect(safeParseNumeric('85%')).toBe(85);
      expect(safeParseNumeric('$abc', 50)).toBe(50);
      expect(safeParseNumeric(NaN, 10)).toBe(10);
      expect(safeParseNumeric(undefined, 0)).toBe(0);
      expect(safeParseNumeric(null, 0)).toBe(0);
    });

    it('safeParseNullableNumeric returns null for missing or invalid values', () => {
      expect(safeParseNullableNumeric('0.45')).toBe(0.45);
      expect(safeParseNullableNumeric('')).toBeNull();
      expect(safeParseNullableNumeric('   ')).toBeNull();
      expect(safeParseNullableNumeric('N/A')).toBeNull();
      expect(safeParseNullableNumeric(undefined)).toBeNull();
    });
  });

  describe('CSV Tokenizer & Quote edge cases', () => {
    it('parses comma-separated values correctly', () => {
      expect(parseCSVLine('A,B,C')).toEqual(['A', 'B', 'C']);
    });

    it('handles quoted commas properly', () => {
      expect(parseCSVLine('First Bank,"SBA, Express",10000')).toEqual([
        'First Bank',
        'SBA, Express',
        '10000',
      ]);
    });

    it('handles escaped double-quotes within fields', () => {
      expect(parseCSVLine('Bank,"Requires ""special"" injection",50000')).toEqual([
        'Bank',
        'Requires "special" injection',
        '50000',
      ]);
    });

    it('recovers gracefully from unclosed quotes', () => {
      expect(parseCSVLine('Bank,"Unclosed field,10000')).toEqual([
        'Bank',
        'Unclosed field,10000',
      ]);
    });
  });

  describe('Row boundary errors and value sanitization', () => {
    it('skips rows missing lender name', () => {
      const csv = `lender_name,program_type,min_loan_amount,max_loan_amount,min_credit_score
,SBA Express,25000,350000,680
Valid Bank,SBA Express,25000,350000,680`;

      const report = parseLenderCSVWithReport(csv);
      expect(report.programs).toHaveLength(1);
      expect(report.programs[0].lender_name).toBe('Valid Bank');
      expect(report.warnings.some((w) => w.includes('Missing lender name'))).toBe(true);
    });

    it('swaps inverted min and max loan amounts gracefully', () => {
      const csv = `lender_name,program_type,min_loan_amount,max_loan_amount,min_credit_score
Inverted Bank,7(a),500000,50000,680`;

      const report = parseLenderCSVWithReport(csv);
      expect(report.programs).toHaveLength(1);
      expect(report.programs[0].min_loan_amount).toBe(50000);
      expect(report.programs[0].max_loan_amount).toBe(500000);
      expect(report.warnings.some((w) => w.includes('Values swapped'))).toBe(true);
    });

    it('swaps inverted interest rates gracefully', () => {
      const csv = `lender_name,program_type,min_loan_amount,max_loan_amount,min_credit_score,credit_tier_required,min_years_in_business,interest_rate_min,interest_rate_max
Rate Inverted Bank,7(a),50000,500000,680,Good,2,12.5,9.5`;

      const report = parseLenderCSVWithReport(csv);
      expect(report.programs).toHaveLength(1);
      expect(report.programs[0].interest_rate_min).toBe(9.5);
      expect(report.programs[0].interest_rate_max).toBe(12.5);
    });

    it('normalizes collateral values to Yes, No, or Varies', () => {
      const csv = `lender_name,program_type,min_loan_amount,max_loan_amount,min_credit_score,credit_tier_required,min_years_in_business,interest_rate_min,interest_rate_max,max_term_months,sba_guarantee_pct,eligible_business_types,requires_collateral
Bank1,7(a),10000,100000,600,Fair,1,10,12,120,75,All,yes
Bank2,7(a),10000,100000,600,Fair,1,10,12,120,75,All,none
Bank3,7(a),10000,100000,600,Fair,1,10,12,120,75,All,maybe`;

      const programs = parseLenderCSV(csv);
      expect(programs[0].requires_collateral).toBe('Yes');
      expect(programs[1].requires_collateral).toBe('No');
      expect(programs[2].requires_collateral).toBe('Varies');
    });

    it('isolates row errors: valid rows are parsed even if an intermediate row fails', () => {
      const csv = `lender_name,program_type,min_loan_amount,max_loan_amount,min_credit_score
Good Bank 1,7(a),10000,100000,620
,,
Good Bank 2,7(a),20000,200000,660`;

      const report = parseLenderCSVWithReport(csv);
      expect(report.programs).toHaveLength(2);
      expect(report.programs.map((p) => p.lender_name)).toEqual(['Good Bank 1', 'Good Bank 2']);
    });
  });

  describe('Default sample data parsing parity', () => {
    it('successfully loads all default programs from sample_lenders.csv', () => {
      expect(DEFAULT_LENDER_PROGRAMS.length).toBe(49);
      expect(DEFAULT_LENDER_PROGRAMS[0].lender_name).toBe('First National Bank');
      expect(DEFAULT_LENDER_PROGRAMS[0].program_type).toBe('Community Advantage');
      expect(DEFAULT_LENDER_PROGRAMS[0].min_loan_amount).toBe(10000);
      expect(DEFAULT_LENDER_PROGRAMS[0].max_loan_amount).toBe(250000);
    });
  });
});
