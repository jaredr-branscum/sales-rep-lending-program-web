import { describe, it, expect } from 'vitest';
import { evaluateProgram, evaluatePrograms, sortMatchResults } from '../matchEngine';
import type { LenderProgram, BorrowerInputs } from '../../types/lender';

const baseProgram: LenderProgram = {
  lender_name: 'Test Lender',
  program_type: '7(a) Small Loan',
  min_loan_amount: 50000,
  max_loan_amount: 250000,
  min_credit_score: 660,
  credit_tier_required: 'Good',
  min_years_in_business: 2,
  interest_rate_min: 9.5,
  interest_rate_max: 11.5,
  max_term_months: 120,
  sba_guarantee_pct: 85,
  eligible_business_types: 'All',
  requires_collateral: 'No',
  max_existing_debt_ratio: 0.5,
  turnaround_days: 20,
  special_requirements: '',
  last_updated: '1/15/2026',
};

describe('matchEngine', () => {
  it('identifies exact fit (QUALIFIED) with zero deltas and high fitScore', () => {
    const inputs: BorrowerInputs = {
      loanAmount: 100000,
      creditScore: 700,
      yearsInBusiness: 3,
      industry: 'Retail',
      collateralAvailable: false,
    };

    const result = evaluateProgram(baseProgram, inputs);

    expect(result.status).toBe('QUALIFIED');
    expect(result.deltas).toHaveLength(0);
    expect(result.fitScore).toBeGreaterThanOrEqual(95);
  });

  describe('near-miss delta calculations', () => {
    it('marks NEAR_MISS when business age is short by 6 months (0.5 years)', () => {
      const inputs: BorrowerInputs = {
        loanAmount: 100000,
        creditScore: 700,
        yearsInBusiness: 1.5, // 0.5 year short
        industry: 'Retail',
        collateralAvailable: false,
      };

      const result = evaluateProgram(baseProgram, inputs);

      expect(result.status).toBe('NEAR_MISS');
      expect(result.deltas).toContain('Need +6 months in business');
      expect(result.fitScore).toBeGreaterThanOrEqual(50);
      expect(result.fitScore).toBeLessThanOrEqual(85);
    });

    it('marks NEAR_MISS when credit score is within 15 points', () => {
      const inputs: BorrowerInputs = {
        loanAmount: 100000,
        creditScore: 650, // 10 points below min (660)
        yearsInBusiness: 2,
        industry: 'Retail',
        collateralAvailable: false,
      };

      const result = evaluateProgram(baseProgram, inputs);

      expect(result.status).toBe('NEAR_MISS');
      expect(result.deltas).toContain('Need +10 credit score points (minimum 660)');
    });

    it('marks NEAR_MISS when loan amount is within 15% of range boundary', () => {
      const inputs: BorrowerInputs = {
        loanAmount: 45000, // 10% below min_loan_amount (50,000)
        creditScore: 700,
        yearsInBusiness: 2,
        industry: 'Retail',
        collateralAvailable: false,
      };

      const result = evaluateProgram(baseProgram, inputs);

      expect(result.status).toBe('NEAR_MISS');
      expect(result.deltas[0]).toContain('below minimum $50,000');
    });
  });

  describe('ineligible filtering', () => {
    it('marks INELIGIBLE when credit score gap exceeds 15 points', () => {
      const inputs: BorrowerInputs = {
        loanAmount: 100000,
        creditScore: 600, // 60 points below 660
        yearsInBusiness: 2,
        industry: 'Retail',
        collateralAvailable: false,
      };

      const result = evaluateProgram(baseProgram, inputs);

      expect(result.status).toBe('INELIGIBLE');
      expect(result.deltas).toContain('Need +60 credit score points (minimum 660)');
    });

    it('marks INELIGIBLE when industry does not match and is not All', () => {
      const nicheProgram: LenderProgram = {
        ...baseProgram,
        eligible_business_types: 'Manufacturing',
      };

      const inputs: BorrowerInputs = {
        loanAmount: 100000,
        creditScore: 700,
        yearsInBusiness: 2,
        industry: 'Restaurant/Food Service',
        collateralAvailable: false,
      };

      const result = evaluateProgram(nicheProgram, inputs);

      expect(result.status).toBe('INELIGIBLE');
      expect(result.deltas[0]).toContain("Ineligible industry 'Restaurant/Food Service'");
    });

    it('marks INELIGIBLE when collateral is required but unavailable', () => {
      const collateralProgram: LenderProgram = {
        ...baseProgram,
        requires_collateral: 'Yes',
      };

      const inputs: BorrowerInputs = {
        loanAmount: 100000,
        creditScore: 700,
        yearsInBusiness: 2,
        industry: 'Retail',
        collateralAvailable: false,
      };

      const result = evaluateProgram(collateralProgram, inputs);

      expect(result.status).toBe('INELIGIBLE');
      expect(result.deltas).toContain('Program requires collateral (none available)');
    });
  });

  describe('sorting behavior', () => {
    it('sorts QUALIFIED programs by shortest turnaround time first', () => {
      const progSlow: LenderProgram = { ...baseProgram, lender_name: 'Slow Lender', turnaround_days: 45 };
      const progFast: LenderProgram = { ...baseProgram, lender_name: 'Fast Lender', turnaround_days: 7 };
      const progMid: LenderProgram = { ...baseProgram, lender_name: 'Mid Lender', turnaround_days: 15 };

      const inputs: BorrowerInputs = {
        loanAmount: 100000,
        creditScore: 700,
        yearsInBusiness: 3,
        industry: 'Retail',
        collateralAvailable: true,
      };

      const results = evaluatePrograms([progSlow, progFast, progMid], inputs);

      expect(results.map((r) => r.program.lender_name)).toEqual(['Fast Lender', 'Mid Lender', 'Slow Lender']);
    });

    it('prioritizes programs without special requirements ahead of programs with special requirements', () => {
      const progWithSpecial: LenderProgram = {
        ...baseProgram,
        lender_name: 'Special Conditions Bank',
        turnaround_days: 5,
        special_requirements: 'Requires 10% owner injection',
      };
      const progClean: LenderProgram = {
        ...baseProgram,
        lender_name: 'Standard Direct Bank',
        turnaround_days: 12,
        special_requirements: '',
      };

      const inputs: BorrowerInputs = {
        loanAmount: 100000,
        creditScore: 700,
        yearsInBusiness: 3,
        industry: 'Retail',
        collateralAvailable: true,
      };

      const results = evaluatePrograms([progWithSpecial, progClean], inputs);

      // Standard Direct Bank has no special requirements, so it is prioritized first
      expect(results[0].program.lender_name).toBe('Standard Direct Bank');
      expect(results[1].program.lender_name).toBe('Special Conditions Bank');
    });

    it('sorts strictly by lowest rate (RATE_ASC) without overriding by special requirements', () => {
      const progLowRateWithSpecial: LenderProgram = {
        ...baseProgram,
        lender_name: 'Low Rate Special Bank',
        interest_rate_min: 5.25,
        turnaround_days: 45,
        special_requirements: 'Owner must have 20%+ equity stake',
      };
      const progMidRateClean: LenderProgram = {
        ...baseProgram,
        lender_name: 'Mid Rate Clean Bank',
        interest_rate_min: 6.5,
        turnaround_days: 10,
        special_requirements: '',
      };
      const progHighRateClean: LenderProgram = {
        ...baseProgram,
        lender_name: 'High Rate Clean Bank',
        interest_rate_min: 9.75,
        turnaround_days: 5,
        special_requirements: '',
      };

      const inputs: BorrowerInputs = {
        loanAmount: 100000,
        creditScore: 700,
        yearsInBusiness: 3,
        industry: 'Retail',
        collateralAvailable: true,
      };

      const results = evaluatePrograms(
        [progMidRateClean, progLowRateWithSpecial, progHighRateClean],
        inputs
      );
      const sortedByRate = sortMatchResults(results, 'RATE_ASC', 'QUALIFIED');

      // The 5.25% loan must be first, despite having special requirements
      expect(sortedByRate[0].program.lender_name).toBe('Low Rate Special Bank');
      expect(sortedByRate[0].program.interest_rate_min).toBe(5.25);
      expect(sortedByRate[1].program.lender_name).toBe('Mid Rate Clean Bank');
      expect(sortedByRate[1].program.interest_rate_min).toBe(6.5);
      expect(sortedByRate[2].program.lender_name).toBe('High Rate Clean Bank');
      expect(sortedByRate[2].program.interest_rate_min).toBe(9.75);
    });

    it('breaks ties using special requirements when interest rates are identical', () => {
      const progTiedSpecial: LenderProgram = {
        ...baseProgram,
        lender_name: 'Tied Rate Special Bank',
        interest_rate_min: 6.5,
        special_requirements: 'Must have clean tax returns',
      };
      const progTiedClean: LenderProgram = {
        ...baseProgram,
        lender_name: 'Tied Rate Clean Bank',
        interest_rate_min: 6.5,
        special_requirements: '',
      };

      const inputs: BorrowerInputs = {
        loanAmount: 100000,
        creditScore: 700,
        yearsInBusiness: 3,
        industry: 'Retail',
        collateralAvailable: true,
      };

      const results = evaluatePrograms([progTiedSpecial, progTiedClean], inputs);
      const sorted = sortMatchResults(results, 'RATE_ASC', 'QUALIFIED');

      // When rates are tied at 6.50%, the clean program without special requirements wins tie-breaker
      expect(sorted[0].program.lender_name).toBe('Tied Rate Clean Bank');
      expect(sorted[1].program.lender_name).toBe('Tied Rate Special Bank');
    });

    it('sorts properly for turnaround and loan cap', () => {
      const progA: LenderProgram = {
        ...baseProgram,
        lender_name: 'Fast Small Bank',
        turnaround_days: 7,
        max_loan_amount: 500000,
      };
      const progB: LenderProgram = {
        ...baseProgram,
        lender_name: 'Slow Large Bank',
        turnaround_days: 30,
        max_loan_amount: 5000000,
      };

      const inputs: BorrowerInputs = {
        loanAmount: 100000,
        creditScore: 700,
        yearsInBusiness: 3,
        industry: 'Retail',
        collateralAvailable: true,
      };

      const results = evaluatePrograms([progA, progB], inputs);

      const byTurnaround = sortMatchResults(results, 'TURNAROUND_ASC', 'QUALIFIED');
      expect(byTurnaround[0].program.lender_name).toBe('Fast Small Bank');

      const byMaxLoan = sortMatchResults(results, 'MAX_LOAN_DESC', 'QUALIFIED');
      expect(byMaxLoan[0].program.lender_name).toBe('Slow Large Bank');
    });
  });
});
