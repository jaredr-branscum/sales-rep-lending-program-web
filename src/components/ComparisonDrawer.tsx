import React, { useState } from 'react';
import type { LenderProgram, BorrowerInputs } from '../types/lender';
import {
  Copy,
  Check,
  X,
  Layers,
  ArrowRight,
  Clock,
} from 'lucide-react';

interface ComparisonDrawerProps {
  selectedPrograms: LenderProgram[];
  onRemoveProgram: (program: LenderProgram) => void;
  onClearSelection: () => void;
  borrowerInputs: BorrowerInputs;
}

export const ComparisonDrawer: React.FC<ComparisonDrawerProps> = ({
  selectedPrograms,
  onRemoveProgram,
  onClearSelection,
  borrowerInputs,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (selectedPrograms.length === 0) return null;

  const generateMarkdownPitch = (): string => {
    const formattedLoan = borrowerInputs.loanAmount > 0
      ? `$${borrowerInputs.loanAmount.toLocaleString()}`
      : 'your requested amount';

    const header = `### SBA Lending Options for Your Business\n\nHi! Based on our call and your target loan of ${formattedLoan}, here is a side-by-side comparison of the top SBA lending programs suited for your profile:\n\n`;

    const body = selectedPrograms
      .map((p, idx) => {
        const specialNote = p.special_requirements ? `\n   - **Requirement:** ${p.special_requirements}` : '';
        const collateral = p.requires_collateral !== 'No' ? `\n   - **Collateral:** ${p.requires_collateral}` : '';
        return `**${idx + 1}. ${p.lender_name} — ${p.program_type}**
   - **Interest Rate:** ${p.interest_rate_min}% - ${p.interest_rate_max}%
   - **Max Loan Amount:** $${p.max_loan_amount.toLocaleString()} (Term: up to ${p.max_term_months} mos)
   - **Estimated Turnaround:** ~${p.turnaround_days} business days
   - **SBA Guarantee:** ${p.sba_guarantee_pct}%${collateral}${specialNote}`;
      })
      .join('\n\n');

    const footer = `\n\n---\n*Next Steps: Review the options above and reply with the program you would like to prioritize, and I will fast-track your lender intake.*`;

    return header + body + footer;
  };

  const handleCopyPitch = async () => {
    const pitch = generateMarkdownPitch();
    try {
      await navigator.clipboard.writeText(pitch);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for non-secure contexts
      const textarea = document.createElement('textarea');
      textarea.value = pitch;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <>
      {/* Floating Bottom Bar */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-4xl bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl px-5 py-3 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center gap-3 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <div className="flex items-center gap-2 shrink-0">
            <Layers className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-bold text-white">
              {selectedPrograms.length} / 4 Selected
            </span>
          </div>

          {/* Program Chips */}
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {selectedPrograms.map((p) => (
              <span
                key={`${p.lender_name}-${p.program_type}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-200 shrink-0"
              >
                <span className="truncate max-w-[120px]">{p.lender_name}</span>
                <button
                  type="button"
                  onClick={() => onRemoveProgram(p)}
                  className="hover:text-red-400 p-0.5 rounded-full"
                  aria-label={`Remove ${p.lender_name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleCopyPitch}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Pitch Copied!' : 'Copy Pitch'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all cursor-pointer"
          >
            <span>Compare Table</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClearSelection}
            className="text-xs text-slate-400 hover:text-white px-2 py-1"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Side-by-Side Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Side-by-Side SBA Lender Comparison
                </h2>
                <p className="text-xs text-slate-500">
                  Comparing {selectedPrograms.length} shortlisted programs for live call evaluation
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyPitch}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Pitch Copied!' : 'Copy Client Pitch'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Table Body */}
            <div className="p-6 overflow-x-auto overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="py-3 px-4 bg-slate-100 font-bold text-slate-700 w-44 rounded-tl-lg">
                      Specification
                    </th>
                    {selectedPrograms.map((p) => (
                      <th
                        key={`${p.lender_name}-${p.program_type}`}
                        className="py-3 px-4 bg-slate-50 font-bold text-slate-900 min-w-[200px]"
                      >
                        <div className="text-sm font-extrabold text-blue-900">{p.lender_name}</div>
                        <div className="text-[11px] font-semibold text-blue-600 mt-0.5">
                          {p.program_type}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Rates */}
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/50">
                      Interest Rate Range
                    </td>
                    {selectedPrograms.map((p) => (
                      <td key={p.lender_name + p.program_type} className="py-3 px-4 font-bold text-slate-900">
                        {p.interest_rate_min}% - {p.interest_rate_max}%
                      </td>
                    ))}
                  </tr>

                  {/* Turnaround Days */}
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/50">
                      Turnaround Speed
                    </td>
                    {selectedPrograms.map((p) => (
                      <td key={p.lender_name + p.program_type} className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          {p.turnaround_days} Days
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Max Loan Amount */}
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/50">
                      Loan Amount Limits
                    </td>
                    {selectedPrograms.map((p) => (
                      <td key={p.lender_name + p.program_type} className="py-3 px-4 text-slate-800">
                        ${p.min_loan_amount.toLocaleString()} - ${p.max_loan_amount.toLocaleString()}
                      </td>
                    ))}
                  </tr>

                  {/* Max Term */}
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/50">
                      Maximum Term
                    </td>
                    {selectedPrograms.map((p) => (
                      <td key={p.lender_name + p.program_type} className="py-3 px-4 text-slate-800">
                        {p.max_term_months} Months ({Math.round(p.max_term_months / 12)} Yrs)
                      </td>
                    ))}
                  </tr>

                  {/* SBA Guarantee */}
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/50">
                      SBA Guarantee %
                    </td>
                    {selectedPrograms.map((p) => (
                      <td key={p.lender_name + p.program_type} className="py-3 px-4 font-semibold text-slate-800">
                        {p.sba_guarantee_pct}%
                      </td>
                    ))}
                  </tr>

                  {/* Min Credit Score */}
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/50">
                      Credit Requirement
                    </td>
                    {selectedPrograms.map((p) => (
                      <td key={p.lender_name + p.program_type} className="py-3 px-4 text-slate-800">
                        {p.min_credit_score}+ ({p.credit_tier_required})
                      </td>
                    ))}
                  </tr>

                  {/* Min Years in Business */}
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/50">
                      Min Time in Business
                    </td>
                    {selectedPrograms.map((p) => (
                      <td key={p.lender_name + p.program_type} className="py-3 px-4 text-slate-800">
                        {p.min_years_in_business} {p.min_years_in_business === 1 ? 'Year' : 'Years'}
                      </td>
                    ))}
                  </tr>

                  {/* Collateral */}
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/50">
                      Collateral Needed
                    </td>
                    {selectedPrograms.map((p) => (
                      <td key={p.lender_name + p.program_type} className="py-3 px-4 text-slate-800">
                        <span className={`px-2 py-0.5 rounded font-semibold ${
                          p.requires_collateral === 'No'
                            ? 'bg-emerald-50 text-emerald-700'
                            : p.requires_collateral === 'Yes'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                        }`}>
                          {p.requires_collateral}
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Special Requirements */}
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-600 bg-slate-50/50">
                      Special Requirements
                    </td>
                    {selectedPrograms.map((p) => (
                      <td key={p.lender_name + p.program_type} className="py-3 px-4 text-slate-700 italic">
                        {p.special_requirements || 'Standard SBA 7(a)/504 guidelines'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Tip: Use "Copy Client Pitch" to generate a tailored borrower proposal.
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
