import React, { useState, useEffect } from 'react';
import type { BorrowerInputs } from '../types/lender';
import { DollarSign, Building2, Calendar, Award, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';

interface TriageBarProps {
  inputs: BorrowerInputs;
  onChange: (updated: BorrowerInputs) => void;
  qualifiedCount: number;
  nearMissCount: number;
  ineligibleCount: number;
}

export const SBA_INDUSTRIES = [
  'All',
  'Construction',
  'Healthcare',
  'Manufacturing',
  'Professional Services',
  'Restaurant/Food Service',
  'Retail',
] as const;

/**
 * Sanitizes years in business input to prevent leading zero accumulation
 * while preserving valid decimals (e.g. "0.5") and empty backspace states.
 */
export function cleanYearsInput(raw: string): string {
  if (!raw) return '';
  // Remove any character other than digits and decimal point
  let cleaned = raw.replace(/[^0-9.]/g, '');
  // Keep only the first decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = `${parts[0]}.${parts.slice(1).join('')}`;
  }
  // Strip leading zeros before another digit (e.g. "02" -> "2", "0125" -> "125", "00" -> "0")
  if (/^0+[0-9]/.test(cleaned)) {
    cleaned = cleaned.replace(/^0+/, '') || '0';
  }
  return cleaned;
}

export const TriageBar: React.FC<TriageBarProps> = ({
  inputs,
  onChange,
  qualifiedCount,
  nearMissCount,
  ineligibleCount,
}) => {
  // Local string state to handle backspacing and numeric formatting without locking leading zeros
  const [yearsInput, setYearsInput] = useState<string>(
    inputs.yearsInBusiness > 0 ? String(inputs.yearsInBusiness) : ''
  );

  useEffect(() => {
    const parsed = parseFloat(yearsInput);
    const currentNum = Number.isNaN(parsed) ? 0 : parsed;
    if (currentNum !== inputs.yearsInBusiness) {
      setYearsInput(inputs.yearsInBusiness > 0 ? String(inputs.yearsInBusiness) : '');
    }
  }, [inputs.yearsInBusiness]);

  const handleLoanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const num = rawVal ? Math.min(10000000, Math.max(0, parseInt(rawVal, 10))) : 0;
    onChange({ ...inputs, loanAmount: num });
  };

  const handleYearsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = cleanYearsInput(e.target.value);
    setYearsInput(cleaned);

    if (cleaned === '' || cleaned === '.') {
      onChange({ ...inputs, yearsInBusiness: 0 });
      return;
    }

    const val = parseFloat(cleaned);
    if (!Number.isNaN(val)) {
      onChange({ ...inputs, yearsInBusiness: Math.min(50, Math.max(0, val)) });
    }
  };

  const handleYearsBlur = () => {
    if (yearsInput === '' || yearsInput === '.') {
      setYearsInput('');
      onChange({ ...inputs, yearsInBusiness: 0 });
    } else {
      const val = parseFloat(yearsInput);
      if (!Number.isNaN(val)) {
        const clamped = Math.min(50, Math.max(0, val));
        setYearsInput(clamped > 0 ? String(clamped) : (yearsInput === '0' ? '0' : ''));
        onChange({ ...inputs, yearsInBusiness: clamped });
      }
    }
  };

  const handleYearsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const current = parseFloat(yearsInput) || 0;
      const next = Math.min(50, Math.round((current + 0.5) * 10) / 10);
      setYearsInput(String(next));
      onChange({ ...inputs, yearsInBusiness: next });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const current = parseFloat(yearsInput) || 0;
      const next = Math.max(0, Math.round((current - 0.5) * 10) / 10);
      setYearsInput(next > 0 ? String(next) : '');
      onChange({ ...inputs, yearsInBusiness: next });
    }
  };

  const handleCreditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const num = rawVal ? Math.min(850, Math.max(0, parseInt(rawVal, 10))) : 0;
    onChange({ ...inputs, creditScore: num });
  };

  const handleIndustryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...inputs, industry: e.target.value });
  };

  const toggleCollateral = () => {
    onChange({ ...inputs, collateralAvailable: !inputs.collateralAvailable });
  };

  return (
    <div className="sticky top-0 z-30 bg-slate-900 text-white shadow-xl border-b border-slate-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Quick Input Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 flex-1">
            {/* 1. Loan Amount */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
              <label htmlFor="triage-loan-amount" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Loan Needed
              </label>
              <div className="flex items-center gap-1.5 mt-0.5">
                <DollarSign className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <input
                  id="triage-loan-amount"
                  type="text"
                  value={inputs.loanAmount > 0 ? inputs.loanAmount.toLocaleString('en-US') : ''}
                  onChange={handleLoanChange}
                  placeholder="150,000"
                  className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* 2. Years In Business */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
              <label htmlFor="triage-years-in-biz" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Years in Business
              </label>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <input
                  id="triage-years-in-biz"
                  type="text"
                  inputMode="decimal"
                  value={yearsInput}
                  onChange={handleYearsChange}
                  onBlur={handleYearsBlur}
                  onKeyDown={handleYearsKeyDown}
                  placeholder="0"
                  className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* 3. Credit Score */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
              <div className="flex items-center justify-between">
                <label htmlFor="triage-credit-score" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Credit Score
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onChange({ ...inputs, creditScore: 620 })}
                    className={`text-[9px] px-1 py-0.2 rounded font-semibold transition-colors cursor-pointer ${
                      inputs.creditScore >= 580 && inputs.creditScore < 660
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Quick set Fair (620)"
                  >
                    Fair
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...inputs, creditScore: 680 })}
                    className={`text-[9px] px-1 py-0.2 rounded font-semibold transition-colors cursor-pointer ${
                      inputs.creditScore >= 660 && inputs.creditScore < 720
                        ? 'bg-blue-400/20 text-blue-300 border border-blue-400/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Quick set Good (680)"
                  >
                    Good
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange({ ...inputs, creditScore: 740 })}
                    className={`text-[9px] px-1 py-0.2 rounded font-semibold transition-colors cursor-pointer ${
                      inputs.creditScore >= 720
                        ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Quick set Excellent (740)"
                  >
                    Exc
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Award className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <input
                  id="triage-credit-score"
                  type="number"
                  min="300"
                  max="850"
                  value={inputs.creditScore > 0 ? inputs.creditScore : ''}
                  onChange={handleCreditChange}
                  placeholder="680"
                  className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* 4. Industry */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
              <label htmlFor="triage-industry" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Industry
              </label>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <select
                  id="triage-industry"
                  value={inputs.industry}
                  onChange={handleIndustryChange}
                  className="w-full bg-transparent text-sm font-medium text-white focus:outline-none cursor-pointer truncate [&>option]:bg-slate-800 [&>option]:text-white"
                >
                  {SBA_INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind === 'All' ? 'All Industries' : ind}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 5. Collateral Toggle */}
            <div className="bg-slate-800/90 border border-slate-700/80 rounded-lg px-3 py-1.5 flex items-center justify-between col-span-2 sm:col-span-1">
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Collateral
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {inputs.collateralAvailable ? 'Available' : 'None / Pledge'}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleCollateral}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  inputs.collateralAvailable ? 'bg-blue-600' : 'bg-slate-600'
                }`}
                aria-label="Toggle collateral availability"
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    inputs.collateralAvailable ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Real-time Result Counter Badges */}
          <div className="flex items-center gap-2 shrink-0 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800 self-stretch sm:self-auto justify-around sm:justify-start">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{qualifiedCount} Qualified</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-800/80 text-amber-300 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{nearMissCount} Near-Miss</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/70 border border-slate-700/80 text-slate-400 text-xs font-medium">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
              <span>{ineligibleCount} Ineligible</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
