import React, { useState, useMemo } from 'react';
import type { BorrowerInputs, LenderProgram, MatchResult } from './types/lender';
import { DEFAULT_LENDER_PROGRAMS } from './services/csvParser';
import { evaluatePrograms } from './domain/matchEngine';
import { TriageBar } from './components/TriageBar';
import { LenderCard } from './components/LenderCard';
import { ComparisonDrawer } from './components/ComparisonDrawer';
import {
  Search,
  SlidersHorizontal,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

type FilterTab = 'ALL' | 'QUALIFIED' | 'NEAR_MISS' | 'INELIGIBLE';
type SortOption = 'TURNAROUND_ASC' | 'RATE_ASC' | 'FIT_DESC' | 'MAX_LOAN_DESC';

export const App: React.FC = () => {
  // Live Triage Borrower Inputs
  const [inputs, setInputs] = useState<BorrowerInputs>({
    loanAmount: 150000,
    yearsInBusiness: 2,
    creditScore: 680,
    industry: 'All',
    collateralAvailable: true,
  });

  // UI Filter and Sort State
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('TURNAROUND_ASC');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrograms, setSelectedPrograms] = useState<LenderProgram[]>([]);

  // Real-time Match Calculation
  const evaluatedResults = useMemo(() => {
    return evaluatePrograms(DEFAULT_LENDER_PROGRAMS, inputs);
  }, [inputs]);

  // Aggregate Status Counts
  const counts = useMemo(() => {
    return {
      qualified: evaluatedResults.filter((r) => r.status === 'QUALIFIED').length,
      nearMiss: evaluatedResults.filter((r) => r.status === 'NEAR_MISS').length,
      ineligible: evaluatedResults.filter((r) => r.status === 'INELIGIBLE').length,
    };
  }, [evaluatedResults]);

  // Filtered & Sorted Display Set
  const displayedResults = useMemo(() => {
    let list: MatchResult[] = [...evaluatedResults];

    // Filter Tab
    if (activeTab === 'QUALIFIED') {
      list = list.filter((r) => r.status === 'QUALIFIED');
    } else if (activeTab === 'NEAR_MISS') {
      list = list.filter((r) => r.status === 'NEAR_MISS');
    } else if (activeTab === 'INELIGIBLE') {
      list = list.filter((r) => r.status === 'INELIGIBLE');
    }

    // Search Query (by lender name, program type, or special requirement)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.program.lender_name.toLowerCase().includes(q) ||
          r.program.program_type.toLowerCase().includes(q) ||
          r.program.special_requirements.toLowerCase().includes(q)
      );
    }

    // Sort Selection
    list.sort((a, b) => {
      // Keep QUALIFIED on top if in ALL tab unless explicitly sorted otherwise
      if (activeTab === 'ALL') {
        const rank = (s: string) => (s === 'QUALIFIED' ? 1 : s === 'NEAR_MISS' ? 2 : 3);
        const rankDiff = rank(a.status) - rank(b.status);
        if (rankDiff !== 0) return rankDiff;
      }

      // Prioritize programs WITHOUT special requirements
      const aHasSpecial = Boolean(a.program.special_requirements && a.program.special_requirements.trim().length > 0);
      const bHasSpecial = Boolean(b.program.special_requirements && b.program.special_requirements.trim().length > 0);
      if (aHasSpecial !== bHasSpecial) {
        return aHasSpecial ? 1 : -1;
      }

      switch (sortOption) {
        case 'TURNAROUND_ASC':
          return a.program.turnaround_days - b.program.turnaround_days;
        case 'RATE_ASC':
          return a.program.interest_rate_min - b.program.interest_rate_min;
        case 'FIT_DESC':
          return b.fitScore - a.fitScore;
        case 'MAX_LOAN_DESC':
          return b.program.max_loan_amount - a.program.max_loan_amount;
        default:
          return 0;
      }
    });

    return list;
  }, [evaluatedResults, activeTab, searchQuery, sortOption]);

  // Selection handlers (max 4)
  const toggleSelectProgram = (program: LenderProgram) => {
    setSelectedPrograms((prev) => {
      const exists = prev.some(
        (p) => p.lender_name === program.lender_name && p.program_type === program.program_type
      );
      if (exists) {
        return prev.filter(
          (p) => !(p.lender_name === program.lender_name && p.program_type === program.program_type)
        );
      }
      if (prev.length >= 4) return prev;
      return [...prev, program];
    });
  };

  const removeSelectedProgram = (program: LenderProgram) => {
    setSelectedPrograms((prev) =>
      prev.filter(
        (p) => !(p.lender_name === program.lender_name && p.program_type === program.program_type)
      )
    );
  };

  const clearSelection = () => {
    setSelectedPrograms([]);
  };

  const resetInputs = () => {
    setInputs({
      loanAmount: 150000,
      yearsInBusiness: 2,
      creditScore: 680,
      industry: 'All',
      collateralAvailable: true,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 font-sans antialiased">
      {/* Top Application Header */}
      <header className="bg-slate-950 border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-base tracking-wider shadow-inner">
              N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white">
                  NEWITY
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-900/60 border border-blue-700/60 text-blue-300 font-semibold uppercase tracking-wider">
                  Live Sales Tool
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                SBA Lender Matching & Real-Time Deal Triage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={resetInputs}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Reset intake to default parameters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Form</span>
            </button>
            <div className="text-right hidden sm:block">
              <span className="text-xs font-semibold text-slate-300 block">
                {DEFAULT_LENDER_PROGRAMS.length} Partner Programs
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Rates Current
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Sticky Real-Time Triage Control Bar */}
      <TriageBar
        inputs={inputs}
        onChange={setInputs}
        qualifiedCount={counts.qualified}
        nearMissCount={counts.nearMiss}
        ineligibleCount={counts.ineligible}
      />

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Navigation Tabs and Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          {/* Active Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Programs ({evaluatedResults.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('QUALIFIED')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'QUALIFIED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Qualified Only ({counts.qualified})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('NEAR_MISS')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === 'NEAR_MISS'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Near-Misses ({counts.nearMiss})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('INELIGIBLE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                activeTab === 'INELIGIBLE'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Ineligible ({counts.ineligible})
            </button>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter lenders..."
                className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
              />
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="TURNAROUND_ASC">Fastest Turnaround</option>
                <option value="RATE_ASC">Lowest Min APR</option>
                <option value="FIT_DESC">Highest Fit Score</option>
                <option value="MAX_LOAN_DESC">Largest Loan Cap</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3-Column Responsive Grid */}
        {displayedResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedResults.map((result) => {
              const isSelected = selectedPrograms.some(
                (p) =>
                  p.lender_name === result.program.lender_name &&
                  p.program_type === result.program.program_type
              );

              return (
                <LenderCard
                  key={`${result.program.lender_name}-${result.program.program_type}`}
                  result={result}
                  isSelected={isSelected}
                  onToggleSelect={toggleSelectProgram}
                  canSelectMore={selectedPrograms.length < 4}
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-12">
            <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900">No Matching Lender Programs</h3>
            <p className="text-xs text-slate-500 mt-1">
              No programs meet your active filter criteria. Try adjusting the borrower parameters in
              the triage bar or clearing the active search filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveTab('ALL');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Floating Comparison Drawer & Side-by-Side Modal */}
      <ComparisonDrawer
        selectedPrograms={selectedPrograms}
        onRemoveProgram={removeSelectedProgram}
        onClearSelection={clearSelection}
        borrowerInputs={inputs}
      />
    </div>
  );
};

export default App;
