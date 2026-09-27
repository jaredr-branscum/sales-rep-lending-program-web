# Scope & Architectural Plan: NEWITY Lender Comparison Tool

## 1. USER PERSONA & PAIN POINT
NEWITY sales reps field fast-paced live qualification calls with time-constrained small business owners seeking SBA financing. During these high-stakes conversations, reps must rapidly extract key borrower facts (loan amount needed, industry, credit standing, years in business) while simultaneously navigating fragmented wikis, static PDFs, and a 50-row monthly lender spreadsheet. Flipping across disconnected documents causes dead air, cognitive overload, and delayed or inaccurate loan program recommendations, resulting in lost deals and lengthy onboarding ramp times for new reps. The sales team requires a zero-friction, single-screen web tool that delivers sub-second, deterministic program eligibility and comparison without context switching or manual calculation.

---

## 2. SCOPE TABLE

| Category | Features & Scope Items | Rationale & Practical Trade-offs |
| :--- | :--- | :--- |
| **Build for V1**<br>*(< 2 hours code)* | • **Embedded Dataset & Client-Side CSV Upload**: Out-of-the-box preloading with `sample_lenders.csv` plus a quick file upload button allowing sales reps to update active lending programs on the fly without backend integration.<br>• **Single-Screen Intake Form**: Immediate inputs for Loan Amount ($), Business Type (dropdown), Years in Business (number), and Credit Tier / Score.<br>• **Real-Time Deterministic Matching Engine**: Live filtering against min/max loan size, credit score, tenure, and industry constraints.<br>• **Interactive Comparison Grid**: Displays Lender Name, Program Type (7(a), 504, Express, Community Advantage), Interest Rates, Max Term, SBA Guarantee %, Turnaround Days, Collateral, and Special Requirements.<br>• **Disqualification Reason Badges**: Shows why a program is ineligible (e.g., "Min credit 680 required", "Max loan $250k exceeded") rather than simply hiding it.<br>• **Instant Sort & Quick Filters**: Sort by Turnaround Speed (fastest close) or Interest Rate (lowest cost) with zero latency. | • Prioritizes the phone call workflow: reps need instantaneous answers under call pressure.<br>• Keeping state and data 100% client-side eliminates network latency, backend infrastructure, and deployment friction.<br>• Showing failure reasons prevents reps from second-guessing why certain lenders didn't match.<br>• Client-side CSV upload lets reps immediately ingest fresh monthly rate sheets during calls. |
| **Defer to V2**<br>*(Next immediate sprint)* | • **Borrower-Facing PDF / Email Export**: Generate a co-branded loan options summary to send while wrapping up the call.<br>• **Dedicated Side-by-Side Pinning**: Pin 2–3 selected programs into a dedicated comparison modal.<br>• **Manager Recommendation Analytics**: Track which lenders are recommended most frequently.<br>• **Keyboard Navigation Shortcuts**: Full hotkey navigation (`Tab` + number shortcuts) for ultra-fast data entry. | • Valuable for post-call follow-ups and management visibility, but zero impact on solving the core live-call qualification bottleneck.<br>• Can be implemented cleanly in the next iteration once the core domain logic is verified by reps. |
| **Feature Cuts**<br>*(Rejected for sprint constraints)* | • **Full Backend Server & Relational DB**: No Node/Express/PostgreSQL setup.<br>• **User Auth & Role Management**: No Auth0, OAuth, or RBAC.<br>• **Machine Learning / Algorithmic Ranking**: No opaque scoring models.<br>• **Bi-directional CRM / LOS Sync**: No Salesforce or HubSpot API integrations. | • Adding backend infrastructure for a static ~50-row read-only dataset adds unnecessary failure modes and burns 70%+ of the time budget.<br>• Deterministic logic is mandatory for financial compliance and rep trust—black-box algorithms create confusion on borrower calls. |

---

## 3. SYSTEM ARCHITECTURE

A client-side architecture built with **Vite + React + TypeScript + Tailwind CSS** designed for instant cold starts and sub-millisecond filtering. The architecture strictly enforces **SOLID** principles to isolate business rules from UI representation:

```
src/
├── types/
│   ├── lender.ts               # Core domain interfaces (LenderProgram, BorrowerCriteria, EligibilityResult)
│   └── filter.ts               # UI sorting & filter state interfaces
├── services/
│   └── csvParser.ts            # Data ingestion: parses raw CSV strings into strongly-typed domain records
├── domain/
│   ├── rules/
│   │   ├── loanAmountRule.ts   # Individual qualification rule checks
│   │   ├── creditScoreRule.ts
│   │   └── businessTypeRule.ts
│   └── matchingEngine.ts       # Orchestrates qualification rules; returns match status & mismatch reasons
├── components/
│   ├── BorrowerInputBar.tsx    # Controlled intake form for borrower parameters
│   ├── ProgramList.tsx         # Results container supporting sort and filter states
│   ├── ProgramCard.tsx         # Responsive program comparison item with rate and requirement badges
│   └── IneligibleDrawer.tsx    # Transparent view of non-qualifying programs with rule violation tags
├── App.tsx                     # Top-level composition and reactive state wireup
└── index.css                   # Tailwind CSS utilities and NEWITY design tokens
```

### Application of SOLID Principles

1. **Single Responsibility Principle (SRP)**:
   - `services/csvParser.ts` is solely responsible for data transformation and string-to-primitive normalization.
   - `domain/matchingEngine.ts` strictly computes borrower eligibility and rule evaluations with zero React hooks or DOM knowledge.
   - UI components (`BorrowerInputBar`, `ProgramCard`) focus strictly on presentation and user events.

2. **Open/Closed Principle (OCP)**:
   - Eligibility checks follow a composable rule interface (`EligibilityRule`). Adding future restrictions (e.g., DSCR, franchise approvals, bankruptcy lookbacks) simply requires adding a new evaluator function without modifying the matching pipeline.

3. **Liskov Substitution Principle (LSP)**:
   - All rule evaluators adhere to a standardized contract: `evaluate(program: LenderProgram, criteria: BorrowerCriteria): RuleCheckResult`.

4. **Interface Segregation Principle (ISP)**:
   - Segregated type contracts: UI components only consume `EligibilityResult` and `ProgramSummary` view models rather than requiring the full unparsed CSV schema.

5. **Dependency Inversion Principle (DIP)**:
   - High-level qualification hooks depend on domain abstraction interfaces (`EligibilityEngine`), allowing in-memory static datasets to be seamlessly swapped for API service clients in future sprints without changing UI code.
