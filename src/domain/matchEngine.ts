import type { BorrowerInputs, LenderProgram, MatchResult, MatchStatus } from '../types/lender';

export interface EvaluationOptions {
  loanRangeTolerancePct?: number; // default: 0.15 (15%)
  creditScoreTolerancePts?: number; // default: 15
  businessAgeToleranceYears?: number; // default: 0.5 (6 months)
}

export function evaluateProgram(
  program: LenderProgram,
  inputs: BorrowerInputs,
  options: EvaluationOptions = {}
): MatchResult {
  const loanTolerance = options.loanRangeTolerancePct ?? 0.15;
  const creditTolerance = options.creditScoreTolerancePts ?? 15;
  const ageTolerance = options.businessAgeToleranceYears ?? 0.5;

  const deltas: string[] = [];
  let isNearMissEligible = true;

  // 1. Loan Amount Evaluation
  if (inputs.loanAmount < program.min_loan_amount) {
    const gap = program.min_loan_amount - inputs.loanAmount;
    deltas.push(
      `Loan requested ($${inputs.loanAmount.toLocaleString()}) is below minimum $${program.min_loan_amount.toLocaleString()} (gap: -$${gap.toLocaleString()})`
    );
    const minWithTolerance = program.min_loan_amount * (1 - loanTolerance);
    if (inputs.loanAmount < minWithTolerance) {
      isNearMissEligible = false;
    }
  } else if (inputs.loanAmount > program.max_loan_amount) {
    const gap = inputs.loanAmount - program.max_loan_amount;
    deltas.push(
      `Loan requested ($${inputs.loanAmount.toLocaleString()}) exceeds maximum $${program.max_loan_amount.toLocaleString()} (gap: +$${gap.toLocaleString()})`
    );
    const maxWithTolerance = program.max_loan_amount * (1 + loanTolerance);
    if (inputs.loanAmount > maxWithTolerance) {
      isNearMissEligible = false;
    }
  }

  // 2. Credit Score Evaluation
  if (inputs.creditScore < program.min_credit_score) {
    const gap = program.min_credit_score - inputs.creditScore;
    deltas.push(`Need +${gap} credit score points (minimum ${program.min_credit_score})`);
    if (gap > creditTolerance) {
      isNearMissEligible = false;
    }
  }

  // 3. Years in Business Evaluation
  if (inputs.yearsInBusiness < program.min_years_in_business) {
    const gapYears = program.min_years_in_business - inputs.yearsInBusiness;
    const gapMonths = Math.round(gapYears * 12);
    deltas.push(`Need +${gapMonths} months in business`);
    if (gapYears > ageTolerance) {
      isNearMissEligible = false;
    }
  }

  // 4. Industry / Business Type Evaluation
  const programIndustry = program.eligible_business_types.trim().toLowerCase();
  const borrowerIndustry = (inputs.industry || '').trim().toLowerCase();

  const isIndustryMatch =
    programIndustry === 'all' ||
    borrowerIndustry === '' ||
    borrowerIndustry === 'all' ||
    programIndustry === borrowerIndustry;

  if (!isIndustryMatch) {
    deltas.push(`Ineligible industry '${inputs.industry}' (program requires: ${program.eligible_business_types})`);
    isNearMissEligible = false;
  }

  // 5. Collateral Evaluation
  if (program.requires_collateral === 'Yes' && !inputs.collateralAvailable) {
    deltas.push('Program requires collateral (none available)');
    isNearMissEligible = false;
  }

  // Determine Final MatchStatus
  let status: MatchStatus;
  let fitScore: number;

  if (deltas.length === 0) {
    status = 'QUALIFIED';
    // Base 95-100, granting small bonus for fast turnaround
    const speedBonus = Math.max(0, 5 - Math.floor(program.turnaround_days / 15));
    fitScore = Math.min(100, 95 + speedBonus);
  } else if (isNearMissEligible) {
    status = 'NEAR_MISS';
    // 60-80 based on distance of deltas
    let penalty = 0;
    if (inputs.creditScore < program.min_credit_score) {
      penalty += (program.min_credit_score - inputs.creditScore) * 1;
    }
    if (inputs.yearsInBusiness < program.min_years_in_business) {
      penalty += Math.round((program.min_years_in_business - inputs.yearsInBusiness) * 20);
    }
    fitScore = Math.max(50, Math.min(85, 80 - penalty));
  } else {
    status = 'INELIGIBLE';
    // 0-45 based on number of violations
    fitScore = Math.max(10, Math.min(45, 50 - deltas.length * 12));
  }

  return {
    program,
    status,
    fitScore,
    deltas,
  };
}

export function evaluatePrograms(
  programs: LenderProgram[],
  inputs: BorrowerInputs,
  options?: EvaluationOptions
): MatchResult[] {
  const results = programs.map((p) => evaluateProgram(p, inputs, options));

  // Sort order:
  // 1. QUALIFIED (shortest turnaround time first)
  // 2. NEAR_MISS (highest fitScore first, then shortest turnaround)
  // 3. INELIGIBLE (highest fitScore first, then shortest turnaround)
  const statusRank: Record<MatchStatus, number> = {
    QUALIFIED: 1,
    NEAR_MISS: 2,
    INELIGIBLE: 3,
  };

  return results.sort((a, b) => {
    const rankDiff = statusRank[a.status] - statusRank[b.status];
    if (rankDiff !== 0) return rankDiff;

    if (a.status === 'QUALIFIED') {
      return a.program.turnaround_days - b.program.turnaround_days;
    }

    if (b.fitScore !== a.fitScore) {
      return b.fitScore - a.fitScore;
    }

    return a.program.turnaround_days - b.program.turnaround_days;
  });
}
