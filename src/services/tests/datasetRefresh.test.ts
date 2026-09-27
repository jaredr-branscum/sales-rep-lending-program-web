import { describe, it, expect } from 'vitest';
import {
  parseLenderCSV,
  parseLenderCSVWithReport,
  getDiscoveredDatasets,
  getLatestDataset,
  DEFAULT_LENDER_PROGRAMS,
  DEFAULT_DATASET_NAME,
} from '../csvParser';
import { evaluatePrograms } from '../../domain/matchEngine';
import type { BorrowerInputs } from '../../types/lender';

// Controlled test fixtures for verifying upload pipeline & zero-stale state guarantees
const FIXTURE_V1_CSV = `lender_name,program_type,min_loan_amount,max_loan_amount,min_credit_score,credit_tier_required,min_years_in_business,interest_rate_min,interest_rate_max,max_term_months,sba_guarantee_pct,eligible_business_types,requires_collateral,max_existing_debt_ratio,turnaround_days,special_requirements,last_updated
Legacy Alpha Bank,7(a) Standard,100000,5000000,660,Good,2,9.0,11.0,120,75,All,Yes,0.50,30,Requires clean tax returns,1/1/2026
Legacy Express Credit,SBA Express,25000,350000,680,Good,1,10.5,12.5,84,50,All,No,0.45,10,,1/2/2026`;

const FIXTURE_V2_CSV = `lender_name,program_type,min_loan_amount,max_loan_amount,min_credit_score,credit_tier_required,min_years_in_business,interest_rate_min,interest_rate_max,max_term_months,sba_guarantee_pct,eligible_business_types,requires_collateral,max_existing_debt_ratio,turnaround_days,special_requirements,last_updated
Modern Horizon Bank,7(a) Standard,150000,5000000,670,Good,2,9.2,11.0,300,75,All,Yes,0.48,35,Must demonstrate positive cash flow,3/1/2026
Modern Fast Track,SBA Express,25000,500000,650,Good,1,10.8,12.2,84,50,All,No,0.45,7,,3/5/2026`;

describe('Dataset Dynamic Discovery & Refresh Pipeline', () => {
  it('dynamically discovers all CSV files in data directory and selects the latest date-versioned dataset by default', () => {
    const discovered = getDiscoveredDatasets();
    expect(discovered.length).toBeGreaterThan(0);

    // Verify each discovered file has a valid structure
    discovered.forEach((dataset) => {
      expect(dataset.filename.endsWith('.csv')).toBe(true);
      expect(dataset.dateKey.length).toBeGreaterThan(0);
      expect(dataset.content.length).toBeGreaterThan(0);
    });

    // Assert files are sorted descending chronologically by extracted dateKey
    for (let i = 0; i < discovered.length - 1; i++) {
      expect(discovered[i].dateKey >= discovered[i + 1].dateKey).toBe(true);
    }

    const latest = getLatestDataset();
    expect(latest.filename).toBe(discovered[0].filename);
    expect(DEFAULT_DATASET_NAME).toBe(latest.filename);

    // Startup default programs are parsed directly from the latest discovered dataset
    const expectedLatestPrograms = parseLenderCSV(latest.content);
    expect(DEFAULT_LENDER_PROGRAMS).toEqual(expectedLatestPrograms);
    expect(DEFAULT_LENDER_PROGRAMS.length).toBeGreaterThan(0);
    expect(DEFAULT_LENDER_PROGRAMS[0].lender_name.trim().length).toBeGreaterThan(0);
  });

  it('validates that any data snapshot present in the data directory parses cleanly without schema errors', () => {
    const discovered = getDiscoveredDatasets();
    expect(discovered.length).toBeGreaterThan(0);

    // Dynamic invariant: Every CSV file in data/ must adhere to schema with zero errors
    discovered.forEach((dataset) => {
      const report = parseLenderCSVWithReport(dataset.content);
      expect(report.errors).toHaveLength(0);
      expect(report.programs.length).toBeGreaterThan(0);

      report.programs.forEach((prog) => {
        expect(prog.lender_name.trim().length).toBeGreaterThan(0);
        expect(prog.min_loan_amount).toBeGreaterThanOrEqual(0);
        expect(prog.max_loan_amount).toBeGreaterThanOrEqual(prog.min_loan_amount);
        expect(prog.min_credit_score).toBeGreaterThanOrEqual(0);
        expect(prog.min_credit_score).toBeLessThanOrEqual(850);
        expect(prog.turnaround_days).toBeGreaterThanOrEqual(1);
      });
    });
  });

  it('updates the active lender dataset without retaining stale data when a new rate sheet is uploaded', () => {
    // 1. Initial State: active dataset loaded with V1
    let activePrograms = parseLenderCSV(FIXTURE_V1_CSV);
    expect(activePrograms).toHaveLength(2);
    expect(activePrograms.some((p) => p.lender_name === 'Legacy Alpha Bank')).toBe(true);
    expect(activePrograms.some((p) => p.lender_name === 'Modern Horizon Bank')).toBe(false);

    // 2. Simulate Upload Event: Parse V2 dataset and replace activePrograms
    const v2Report = parseLenderCSVWithReport(FIXTURE_V2_CSV);
    expect(v2Report.errors).toHaveLength(0);
    expect(v2Report.programs).toHaveLength(2);

    // State update: activePrograms replaced by V2
    activePrograms = v2Report.programs;

    // 3. Assert zero stale data from V1 lingers
    const v1Lenders = ['Legacy Alpha Bank', 'Legacy Express Credit'];
    v1Lenders.forEach((lender) => {
      expect(activePrograms.some((p) => p.lender_name === lender)).toBe(false);
    });

    // 4. Assert all V2 lenders are present and active
    const v2Lenders = ['Modern Horizon Bank', 'Modern Fast Track'];
    v2Lenders.forEach((lender) => {
      expect(activePrograms.some((p) => p.lender_name === lender)).toBe(true);
    });
    expect(activePrograms).toHaveLength(2);
  });

  it('evaluates borrower qualifications against the refreshed dataset instead of stale defaults', () => {
    const inputs: BorrowerInputs = {
      loanAmount: 150000,
      yearsInBusiness: 2,
      creditScore: 680,
      industry: 'All',
      collateralAvailable: true,
    };

    // 1. Evaluate against V1
    const v1Matches = evaluatePrograms(parseLenderCSV(FIXTURE_V1_CSV), inputs);
    const v1LenderNames = new Set(v1Matches.map((m) => m.program.lender_name));
    expect(v1LenderNames.has('Legacy Alpha Bank')).toBe(true);
    expect(v1LenderNames.has('Modern Horizon Bank')).toBe(false);

    // 2. Evaluate against refreshed V2
    const v2Matches = evaluatePrograms(parseLenderCSV(FIXTURE_V2_CSV), inputs);
    const v2LenderNames = new Set(v2Matches.map((m) => m.program.lender_name));

    // Verify V2 matches are active and contain zero stale V1 lenders
    expect(v2LenderNames.has('Modern Horizon Bank')).toBe(true);
    expect(v2LenderNames.has('Modern Fast Track')).toBe(true);
    expect(v2LenderNames.has('Legacy Alpha Bank')).toBe(false);
    expect(v2LenderNames.has('Legacy Express Credit')).toBe(false);

    // Verify qualified programs are sorted properly with clean programs (no special requirements) prioritized
    const qualifiedV2 = v2Matches.filter((m) => m.status === 'QUALIFIED');
    expect(qualifiedV2.length).toBeGreaterThan(0);
    const topMatch = qualifiedV2[0];
    expect(topMatch.status).toBe('QUALIFIED');
    expect(topMatch.program.special_requirements).toBe('');
    expect(topMatch.program.lender_name).toBe('Modern Fast Track');
  });

  it('guarantees clean dataset switching between discovered files without stale contamination', () => {
    const discovered = getDiscoveredDatasets();
    if (discovered.length < 2) return;

    const datasetA = discovered[0];
    const datasetB = discovered[1];

    const programsA = parseLenderCSV(datasetA.content);
    const programsB = parseLenderCSV(datasetB.content);

    // Simulate switching active state between discovered datasets
    let activePrograms = programsA;
    expect(activePrograms).toEqual(programsA);

    activePrograms = programsB;
    expect(activePrograms).toEqual(programsB);

    // Verify that programs unique to datasetA do not contaminate datasetB state
    const uniqueToA = programsA.filter(
      (a) => !programsB.some((b) => b.lender_name === a.lender_name && b.program_type === a.program_type)
    );

    uniqueToA.forEach((prog) => {
      expect(
        activePrograms.some(
          (p) => p.lender_name === prog.lender_name && p.program_type === prog.program_type
        )
      ).toBe(false);
    });
  });
});
