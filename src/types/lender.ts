export type ProgramType =
  | 'Community Advantage'
  | 'SBA Express'
  | '504 Loan'
  | '7(a) Small Loan'
  | '7(a) Standard'
  | (string & {});

export type CreditTier = 'Fair' | 'Good' | 'Excellent' | (string & {});

export type CollateralRequirement = 'Yes' | 'No' | 'Varies';

export interface LenderProgram {
  lender_name: string;
  program_type: ProgramType;
  min_loan_amount: number;
  max_loan_amount: number;
  min_credit_score: number;
  credit_tier_required: CreditTier;
  min_years_in_business: number;
  interest_rate_min: number;
  interest_rate_max: number;
  max_term_months: number;
  sba_guarantee_pct: number;
  eligible_business_types: string;
  requires_collateral: CollateralRequirement;
  max_existing_debt_ratio: number | null;
  turnaround_days: number;
  special_requirements: string;
  last_updated: string;
}

export interface BorrowerInputs {
  loanAmount: number;
  yearsInBusiness: number;
  creditScore: number;
  industry: string;
  collateralAvailable: boolean;
}

export type MatchStatus = 'QUALIFIED' | 'NEAR_MISS' | 'INELIGIBLE';

export interface MatchResult {
  program: LenderProgram;
  status: MatchStatus;
  fitScore: number; // 0-100
  deltas: string[];
}
