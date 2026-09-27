import type { LenderProgram, CollateralRequirement, CreditTier, ProgramType } from '../types/lender';
export interface DiscoveredDataset {
  path: string;
  filename: string;
  dateKey: string;
  content: string;
}

/**
 * Extracts a date string from a filename (e.g. 'sample_lenders_2026-03.csv' -> '2026-03').
 */
export function extractDateFromFilename(name: string): string {
  const match = name.match(/\d{4}[-_]\d{2}(?:[-_]\d{2})?/);
  return match ? match[0] : name;
}

/**
 * Dynamically discovers all CSV files in the data directory via Vite's glob import
 * and returns them sorted in descending chronological order (latest date first).
 */
export function getDiscoveredDatasets(): DiscoveredDataset[] {
  // Discovers all CSV files in the data directory dynamically
  const dataModules = import.meta.glob<string>('/data/*.csv', {
    query: '?raw',
    import: 'default',
    eager: true,
  });

  const entries: DiscoveredDataset[] = [];

  for (const [path, content] of Object.entries(dataModules)) {
    const filename = path.split('/').pop() || path;
    entries.push({
      path,
      filename,
      dateKey: extractDateFromFilename(filename),
      content: typeof content === 'string' ? content : '',
    });
  }

  // Sort descending by dateKey, then filename (e.g. '2026-03' before '2026-01')
  return entries.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

export function getLatestDataset(): DiscoveredDataset {
  const datasets = getDiscoveredDatasets();
  return (
    datasets[0] || {
      path: '',
      filename: 'default.csv',
      dateKey: '',
      content: '',
    }
  );
}

export const discoveredDatasets: DiscoveredDataset[] = getDiscoveredDatasets();
export const latestDiscovered: DiscoveredDataset = getLatestDataset();

export const LATEST_DATASET_NAME: string = latestDiscovered.filename;
export const DEFAULT_DATASET_NAME: string = LATEST_DATASET_NAME;
export const RAW_SAMPLE_LENDERS_CSV: string = latestDiscovered.content;

export function getDatasetByDate(datePrefix: string): DiscoveredDataset | undefined {
  return discoveredDatasets.find((d) => d.dateKey.includes(datePrefix));
}

export function getDatasetByFilename(filename: string): DiscoveredDataset | undefined {
  return discoveredDatasets.find((d) => d.filename === filename);
}

export interface CSVParseReport {
  programs: LenderProgram[];
  errors: string[];
  warnings: string[];
}

/**
 * Safely parse a numeric value, stripping currency symbols, commas, and percentage signs.
 * Falls back to defaultValue if invalid, NaN, or non-finite.
 */
export function safeParseNumeric(val: unknown, defaultValue = 0): number {
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : defaultValue;
  }
  if (!val || typeof val !== 'string') return defaultValue;

  const cleaned = val.replace(/[\$,%]/g, '').trim();
  if (!cleaned) return defaultValue;

  const num = Number(cleaned);
  return Number.isFinite(num) ? num : defaultValue;
}

/**
 * Safely parse an optional numeric value (e.g. max debt ratio).
 * Returns null if blank, omitted, or unparseable.
 */
export function safeParseNullableNumeric(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : null;
  }
  if (typeof val !== 'string') return null;

  const cleaned = val.replace(/[\$,%]/g, '').trim();
  if (!cleaned) return null;

  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

/**
 * Robust CSV line tokenizer handling quoted strings, escaped quotes, and commas.
 */
export function parseCSVLine(line: string): string[] {
  if (!line) return [];
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote: "" -> "
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Push final cell
  result.push(current.trim());
  return result;
}

/**
 * Normalizes collateral requirement strings to strict 'Yes' | 'No' | 'Varies'
 */
function normalizeCollateral(val: string | undefined): CollateralRequirement {
  const normalized = (val || '').trim().toLowerCase();
  if (normalized === 'yes' || normalized === 'true' || normalized === 'required') {
    return 'Yes';
  }
  if (normalized === 'no' || normalized === 'false' || normalized === 'none') {
    return 'No';
  }
  return 'Varies';
}

/**
 * Normalizes credit tier strings to 'Fair' | 'Good' | 'Excellent'
 */
function normalizeCreditTier(val: string | undefined): CreditTier {
  const normalized = (val || '').trim().toLowerCase();
  if (normalized.includes('exc')) return 'Excellent';
  if (normalized.includes('fair')) return 'Fair';
  return 'Good';
}

/**
 * Header column aliases for dynamic column mapping
 */
const COLUMN_ALIASES: Record<string, string[]> = {
  lender_name: ['lender_name', 'lender', 'bank', 'institution'],
  program_type: ['program_type', 'program', 'loan_program', 'type'],
  min_loan_amount: ['min_loan_amount', 'min_loan', 'minimum_loan'],
  max_loan_amount: ['max_loan_amount', 'max_loan', 'maximum_loan'],
  min_credit_score: ['min_credit_score', 'min_credit', 'credit_score'],
  credit_tier_required: ['credit_tier_required', 'credit_tier', 'tier'],
  min_years_in_business: ['min_years_in_business', 'years_in_business', 'min_years'],
  interest_rate_min: ['interest_rate_min', 'min_rate', 'rate_min'],
  interest_rate_max: ['interest_rate_max', 'max_rate', 'rate_max'],
  max_term_months: ['max_term_months', 'term_months', 'max_term'],
  sba_guarantee_pct: ['sba_guarantee_pct', 'guarantee_pct', 'guarantee'],
  eligible_business_types: ['eligible_business_types', 'eligible_industries', 'industries', 'business_type'],
  requires_collateral: ['requires_collateral', 'collateral', 'collateral_required'],
  max_existing_debt_ratio: ['max_existing_debt_ratio', 'debt_ratio', 'dscr'],
  turnaround_days: ['turnaround_days', 'turnaround', 'speed_days', 'days'],
  special_requirements: ['special_requirements', 'requirements', 'notes'],
  last_updated: ['last_updated', 'updated', 'date'],
};

function resolveColumnIndices(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  const cleanedHeaders = headers.map((h) => h.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_'));

  for (const [key, aliases] of Object.entries(COLUMN_ALIASES)) {
    for (const alias of aliases) {
      const idx = cleanedHeaders.indexOf(alias);
      if (idx !== -1) {
        map[key] = idx;
        break;
      }
    }
  }

  return map;
}

/**
 * Parses raw CSV content with comprehensive error isolation, boundary checks, and reporting.
 */
export function parseLenderCSVWithReport(csvText: unknown): CSVParseReport {
  const report: CSVParseReport = {
    programs: [],
    errors: [],
    warnings: [],
  };

  if (!csvText || typeof csvText !== 'string') {
    report.warnings.push('CSV input is null, undefined, or not a string. Returned empty programs array.');
    return report;
  }

  const trimmed = csvText.trim();
  if (!trimmed) {
    report.warnings.push('CSV input is empty.');
    return report;
  }

  let lines: string[] = [];
  try {
    lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
  } catch (err) {
    report.errors.push(`Failed to split CSV lines: ${err instanceof Error ? err.message : String(err)}`);
    return report;
  }

  if (lines.length < 2) {
    report.warnings.push('CSV contains only a header or no data rows.');
    return report;
  }

  const rawHeaders = parseCSVLine(lines[0]);
  const colMap = resolveColumnIndices(rawHeaders);

  // If header didn't map lender_name, fallback to default positional mapping
  const usePositional = colMap.lender_name === undefined;
  if (usePositional) {
    report.warnings.push('Could not detect standard column headers; falling back to positional indices.');
  }

  const getCol = (cols: string[], key: string, positionalIdx: number): string | undefined => {
    if (!usePositional && colMap[key] !== undefined) {
      return cols[colMap[key]];
    }
    return cols[positionalIdx];
  };

  for (let i = 1; i < lines.length; i++) {
    const lineNum = i + 1;
    const lineStr = lines[i];

    try {
      const cols = parseCSVLine(lineStr);

      // Boundary check: skip rows with fewer than 5 columns
      if (cols.length < 5) {
        report.warnings.push(`Row ${lineNum}: Skipped due to insufficient columns (${cols.length} cols).`);
        continue;
      }

      const rawLenderName = getCol(cols, 'lender_name', 0);
      const lenderName = (rawLenderName || '').trim();

      // Boundary check: skip rows missing lender name
      if (!lenderName) {
        report.warnings.push(`Row ${lineNum}: Missing lender name. Row skipped.`);
        continue;
      }

      // Safe numeric coercion
      let minLoan = safeParseNumeric(getCol(cols, 'min_loan_amount', 2), 0);
      let maxLoan = safeParseNumeric(getCol(cols, 'max_loan_amount', 3), 0);
      if (minLoan > maxLoan && maxLoan > 0) {
        report.warnings.push(`Row ${lineNum} (${lenderName}): min_loan ($${minLoan}) was greater than max_loan ($${maxLoan}). Values swapped.`);
        const temp = minLoan;
        minLoan = maxLoan;
        maxLoan = temp;
      }

      let minRate = safeParseNumeric(getCol(cols, 'interest_rate_min', 7), 0);
      let maxRate = safeParseNumeric(getCol(cols, 'interest_rate_max', 8), 0);
      if (minRate > maxRate && maxRate > 0) {
        report.warnings.push(`Row ${lineNum} (${lenderName}): interest_rate_min (${minRate}%) was greater than max (${maxRate}%). Values swapped.`);
        const temp = minRate;
        minRate = maxRate;
        maxRate = temp;
      }

      const minCreditScore = Math.max(0, Math.min(850, safeParseNumeric(getCol(cols, 'min_credit_score', 4), 600)));
      const minYears = Math.max(0, safeParseNumeric(getCol(cols, 'min_years_in_business', 6), 0));
      const maxTerm = Math.max(0, safeParseNumeric(getCol(cols, 'max_term_months', 9), 120));
      const sbaGuarantee = Math.max(0, Math.min(100, safeParseNumeric(getCol(cols, 'sba_guarantee_pct', 10), 75)));
      const turnaroundDays = Math.max(1, safeParseNumeric(getCol(cols, 'turnaround_days', 14), 14));

      const program: LenderProgram = {
        lender_name: lenderName,
        program_type: (getCol(cols, 'program_type', 1) || 'Standard SBA') as ProgramType,
        min_loan_amount: minLoan,
        max_loan_amount: maxLoan,
        min_credit_score: minCreditScore,
        credit_tier_required: normalizeCreditTier(getCol(cols, 'credit_tier_required', 5)),
        min_years_in_business: minYears,
        interest_rate_min: minRate,
        interest_rate_max: maxRate,
        max_term_months: maxTerm,
        sba_guarantee_pct: sbaGuarantee,
        eligible_business_types: (getCol(cols, 'eligible_business_types', 11) || 'All').trim() || 'All',
        requires_collateral: normalizeCollateral(getCol(cols, 'requires_collateral', 12)),
        max_existing_debt_ratio: safeParseNullableNumeric(getCol(cols, 'max_existing_debt_ratio', 13)),
        turnaround_days: turnaroundDays,
        special_requirements: (getCol(cols, 'special_requirements', 15) || '').trim(),
        last_updated: (getCol(cols, 'last_updated', 16) || '').trim(),
      };

      report.programs.push(program);
    } catch (rowErr) {
      report.errors.push(`Row ${lineNum}: Unexpected error parsing row (${rowErr instanceof Error ? rowErr.message : String(rowErr)}). Row isolated.`);
    }
  }

  return report;
}

/**
 * Standard parse function returning LenderProgram[] with graceful error recovery.
 */
export function parseLenderCSV(csvText: unknown): LenderProgram[] {
  const { programs } = parseLenderCSVWithReport(csvText);
  return programs;
}

export const DEFAULT_LENDER_PROGRAMS: LenderProgram[] = parseLenderCSV(RAW_SAMPLE_LENDERS_CSV);
