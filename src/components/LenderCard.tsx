import React from 'react';
import type { MatchResult, LenderProgram } from '../types/lender';
import {
  Clock,
  Percent,
  DollarSign,
  Calendar,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Info,
  CheckSquare,
  Square,
} from 'lucide-react';

interface LenderCardProps {
  result: MatchResult;
  isSelected: boolean;
  onToggleSelect: (program: LenderProgram) => void;
  canSelectMore: boolean;
}

export function formatCurrencyAmount(amount: number): string {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    const thousands = amount / 1_000;
    return `$${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(0)}k`;
  }
  return `$${amount.toLocaleString('en-US')}`;
}

export const LenderCard: React.FC<LenderCardProps> = ({
  result,
  isSelected,
  onToggleSelect,
  canSelectMore,
}) => {
  const { program, status, deltas } = result;

  const isQualified = status === 'QUALIFIED';
  const isNearMiss = status === 'NEAR_MISS';
  const isIneligible = status === 'INELIGIBLE';

  const cardBorder = isSelected
    ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md'
    : isQualified
      ? 'border-slate-200 hover:border-blue-300 hover:shadow-md'
      : isNearMiss
        ? 'border-amber-200 hover:border-amber-300 hover:shadow-md'
        : 'border-slate-200/80 bg-slate-50/60 opacity-80';

  return (
    <div
      className={`relative flex flex-col justify-between rounded-xl bg-white p-5 border transition-all duration-150 ${cardBorder}`}
    >
      <div>
        {/* Top Header: Lender & Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {program.program_type}
              </span>
              {program.eligible_business_types !== 'All' && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                  {program.eligible_business_types}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1 leading-snug">
              {program.lender_name}
            </h3>
          </div>

          {/* Status Badge */}
          <div className="shrink-0 flex items-center">
            {isQualified && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Qualified
              </span>
            )}
            {isNearMiss && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Near-Miss
              </span>
            )}
            {isIneligible && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
                <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                Ineligible
              </span>
            )}
          </div>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 py-3 my-2 border-y border-slate-100 text-xs">
          <div className="bg-slate-50/90 border border-slate-100 p-2.5 rounded-lg flex flex-col justify-between min-h-[58px]">
            <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1.5 tracking-wider">
              <Percent className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              Rate Range
            </span>
            <div className="text-sm font-bold text-slate-900 mt-1 whitespace-nowrap">
              {program.interest_rate_min}% - {program.interest_rate_max}%
            </div>
          </div>

          <div className="bg-slate-50/90 border border-slate-100 p-2.5 rounded-lg flex flex-col justify-between min-h-[58px]">
            <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1.5 tracking-wider">
              <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              Turnaround
            </span>
            <div className="text-sm font-bold text-slate-900 mt-1 whitespace-nowrap">
              {program.turnaround_days} Days
            </div>
          </div>

          <div
            className="bg-slate-50/90 border border-slate-100 p-2.5 rounded-lg flex flex-col justify-between min-h-[58px]"
            title={`Full range: $${program.min_loan_amount.toLocaleString()} - $${program.max_loan_amount.toLocaleString()}`}
          >
            <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1.5 tracking-wider">
              <DollarSign className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              Max Loan
            </span>
            <div className="text-sm font-bold text-slate-900 mt-1 whitespace-nowrap">
              {formatCurrencyAmount(program.max_loan_amount)}
            </div>
          </div>

          <div className="bg-slate-50/90 border border-slate-100 p-2.5 rounded-lg flex flex-col justify-between min-h-[58px]">
            <span className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1.5 tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              Max Term
            </span>
            <div className="text-sm font-bold text-slate-900 mt-1 whitespace-nowrap">
              {program.max_term_months} mos
            </div>
          </div>
        </div>

        {/* Secondary Specs & Guarantees */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 py-1.5 px-0.5">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            SBA Guarantee: <strong className="text-slate-700 font-semibold">{program.sba_guarantee_pct}%</strong>
          </span>
          <span>
            Min Score: <strong className="text-slate-700 font-semibold">{program.min_credit_score}</strong> ({program.credit_tier_required})
          </span>
          <span>
            Collateral: <strong className="text-slate-700 font-semibold">{program.requires_collateral}</strong>
          </span>
        </div>

        {/* Special Requirements Pill */}
        {program.special_requirements && (
          <div className="mt-2.5 flex items-start gap-1.5 bg-blue-50/50 border border-blue-100 rounded-md p-2 text-xs text-blue-900">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
            <span className="leading-tight">{program.special_requirements}</span>
          </div>
        )}

        {/* Near-Miss Amber Gaps Pills */}
        {isNearMiss && deltas.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
              Actionable Gap / Pitch Angle:
            </div>
            {deltas.map((delta, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/90 text-amber-900 text-xs font-medium px-2.5 py-1 rounded-md"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="leading-snug">{delta}</span>
              </div>
            ))}
          </div>
        )}

        {/* Ineligible Disqualification Gaps */}
        {isIneligible && deltas.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Disqualifying Gaps:
            </div>
            {deltas.slice(0, 2).map((delta, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-md"
              >
                <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate leading-snug">{delta}</span>
              </div>
            ))}
            {deltas.length > 2 && (
              <span className="text-[10px] text-slate-400 block px-1">
                +{deltas.length - 2} more qualification gaps
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <label
          className={`flex items-center gap-2 text-xs font-semibold cursor-pointer select-none ${
            !isSelected && !canSelectMore ? 'opacity-40 cursor-not-allowed text-slate-400' : 'text-slate-700 hover:text-blue-600'
          }`}
          onClick={(e) => {
            e.preventDefault();
            if (isSelected || canSelectMore) {
              onToggleSelect(program);
            }
          }}
        >
          {isSelected ? (
            <CheckSquare className="w-4 h-4 text-blue-600" />
          ) : (
            <Square className="w-4 h-4 text-slate-400" />
          )}
          <span>{isSelected ? 'Selected' : 'Select for Comparison'}</span>
        </label>

        <span className="text-[10px] text-slate-400">
          Updated {program.last_updated}
        </span>
      </div>
    </div>
  );
};
