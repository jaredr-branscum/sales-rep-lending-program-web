import React, { useState, useMemo } from 'react';
import type { BorrowerInputs } from './types/lender';
import { DEFAULT_LENDER_PROGRAMS } from './services/csvParser';
import { evaluatePrograms } from './domain/matchEngine';

export const App: React.FC = () => {
  const [inputs] = useState<BorrowerInputs>({
    loanAmount: 150000,
    yearsInBusiness: 2,
    creditScore: 680,
    industry: 'All',
    collateralAvailable: true,
  });

  const matchResults = useMemo(() => {
    return evaluatePrograms(DEFAULT_LENDER_PROGRAMS, inputs);
  }, [inputs]);

  const qualifiedCount = matchResults.filter((r) => r.status === 'QUALIFIED').length;
  const nearMissCount = matchResults.filter((r) => r.status === 'NEAR_MISS').length;
  const ineligibleCount = matchResults.filter((r) => r.status === 'INELIGIBLE').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 font-sans">
      <header className="max-w-7xl mx-auto mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          NEWITY | Sales Rep Lender Program Matcher
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Foundational domain layer active with {DEFAULT_LENDER_PROGRAMS.length} programs loaded.
        </p>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <span className="text-xs uppercase font-semibold text-emerald-800">Qualified</span>
            <div className="text-2xl font-bold text-emerald-900 mt-1">{qualifiedCount}</div>
          </div>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <span className="text-xs uppercase font-semibold text-amber-800">Near Miss</span>
            <div className="text-2xl font-bold text-amber-900 mt-1">{nearMissCount}</div>
          </div>
          <div className="p-4 bg-slate-100 border border-slate-300 rounded-lg">
            <span className="text-xs uppercase font-semibold text-slate-700">Ineligible</span>
            <div className="text-2xl font-bold text-slate-800 mt-1">{ineligibleCount}</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
