# Scope & Architectural Plan: NEWITY Lender Comparison Tool

## 1. USER PERSONA & PAIN POINT
NEWITY sales reps field fast-paced live qualification calls with time-constrained small business owners seeking SBA financing. During these high-stakes conversations, reps must rapidly extract key borrower facts (loan amount needed, industry, credit standing, years in business) while simultaneously navigating fragmented wikis, static PDFs, and a 50-row monthly lender spreadsheet. Flipping across disconnected documents causes dead air, cognitive overload, and delayed or inaccurate loan program recommendations, resulting in lost deals and lengthy onboarding ramp times for new reps. The sales team requires a zero-friction, single-screen web tool that delivers sub-second, deterministic program eligibility and comparison without context switching or manual calculation.

---

## 2. SCOPE TABLE

| Category | Features & Scope Items | Rationale & Practical Trade-offs |
| :--- | :--- | :--- |
| **Build for V1**<br>*(< 2 hours code)* | • **Embedded Dataset & Client-Side CSV Upload**: Out-of-the-box preloading with date-versioned CSVs plus a quick file upload button allowing sales reps to update active lending programs on the fly without backend integration.<br>• **Rate Update Flags & Freshness Indicators**: Visual flags and timestamp badges (`Updated M/D/YYYY`) on each lender card, paired with active dataset version pills in the top bar, directly fulfilling the team requirement for *"a way to flag when lender rates are updated"* so reps never quote outdated terms.<br>• **Single-Screen Intake Form**: Immediate inputs for Loan Amount ($), Business Type (dropdown), Years in Business (number), and Credit Tier / Score.<br>• **Real-Time Deterministic Matching Engine**: Live filtering against min/max loan size, credit score, tenure, and industry constraints.<br>• **Interactive Comparison Grid**: Displays Lender Name, Program Type (7(a), 504, Express, Community Advantage), Interest Rates, Max Term, SBA Guarantee %, Turnaround Days, Collateral, and Special Requirements.<br>• **Disqualification Reason Badges**: Shows why a program is ineligible (e.g., "Min credit 680 required", "Max loan $250k exceeded") rather than simply hiding it.<br>• **Instant Sort & Quick Filters**: Sort by Turnaround Speed (fastest close) or Interest Rate (lowest cost) with zero latency. | • Prioritizes the phone call workflow: reps need instantaneous answers under call pressure.<br>• Keeping state and data 100% client-side eliminates network latency, backend infrastructure, and deployment friction.<br>• Rate update flags directly solve the team's need to know rate freshness at a glance, preventing outdated quotes on live borrower calls.<br>• Showing failure reasons prevents reps from second-guessing why certain lenders didn't match.<br>• Client-side CSV upload lets reps immediately ingest fresh monthly rate sheets during calls. |
| **Defer to V2**<br>*(Next immediate sprint)* | • **Full CI/CD Pipeline & Automated Deployment**: Automated GitHub Actions / Cloud Build workflows with multi-environment staging/production promotion.<br>• **Borrower-Facing PDF / Email Export**: Generate a co-branded loan options summary to send while wrapping up the call.<br>• **Dedicated Side-by-Side Pinning**: Pin 2–3 selected programs into a dedicated comparison modal.<br>• **Manager Recommendation Analytics**: Track which lenders are recommended most frequently.<br>• **Keyboard Navigation Shortcuts**: Full hotkey navigation (`Tab` + number shortcuts) for ultra-fast data entry. | • Full CI/CD is out of scope for this project due to time constraints, but will be prioritized in V2 after V1 has demonstrated proof of value to the sales team.<br>• Valuable for post-call follow-ups and management visibility, but zero impact on solving the core live-call qualification bottleneck.<br>• Can be implemented cleanly in the next iteration once the core domain logic is verified by reps. |
| **Feature Cuts**<br>*(Rejected for sprint constraints)* | • **Full Backend Server & Relational DB**: No Node/Express/PostgreSQL setup.<br>• **User Auth & Role Management**: No Auth0, OAuth, or RBAC.<br>• **Machine Learning / Algorithmic Ranking**: No opaque scoring models.<br>• **Bi-directional CRM / LOS Sync**: No Salesforce or HubSpot API integrations. | • Adding backend infrastructure for a static ~50-row read-only dataset adds unnecessary failure modes and burns 70%+ of the time budget.<br>• Deterministic logic is mandatory for financial compliance and rep trust—black-box algorithms create confusion on borrower calls. |

> [!NOTE]
> **CI/CD Scope Remark**: Full CI/CD is out of scope for this project due to time constraints, but would be prioritized in V2 after V1 has demonstrated proof of value.

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
│   ├── ProgramCard.tsx         # Responsive program comparison item with rate, requirement badges, and rate update flag
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

---

## 4. V2 AUTOMATED E2E TEST STRATEGY (PLAYWRIGHT)

The following high-priority end-to-end user workflows are earmarked for automated Playwright test coverage in V2 once CI/CD pipeline automation is established:

### 1. Live Triage Intake & Deterministic Match Reactivity
- **User Journey**: Sales rep inputs loan amount, credit score, years in business, industry, and collateral availability in the sticky triage header during a live borrower call.
- **Automated Assertions**:
  - Sub-second DOM reactivity (< 50ms) across borrower input adjustments with zero page reloads.
  - Triage counter badges (`Qualified`, `Near-Miss`, `Ineligible`) update accurately in real time.
  - Near-miss gap reason tags (e.g., *"Need +6 months in business"*, *"Within 15 pts of min credit"*) render on borderline cards.
  - Ineligible programs display precise disqualification criteria (e.g., *"Min loan $500k exceeded"*, *"Insufficient credit score"*).

### 2. Clean Program Prioritization & Sort Order
- **User Journey**: Rep toggles sort options (`Turnaround Speed`, `Interest Rate Min`, `Best Fit Score`, `Max Loan Amount`) and filters by qualification tabs.
- **Automated Assertions**:
  - Qualified programs without special requirements are strictly prioritized above programs requiring borrower restrictions or owner injections.
  - Instant re-ranking of cards preserves active selections and filter state.
  - Live text search dynamically filters cards by lender name, program type, or keyword without input lag.

### 3. Side-by-Side Comparison Drawer & Pitch Copy
- **User Journey**: Rep selects up to 4 programs for direct side-by-side comparison on the call.
- **Automated Assertions**:
  - Floating bottom comparison bar expands with selected lender badges and program counts.
  - Boundary enforcement: selecting a 5th program is blocked with user guidance.
  - Modal table renders 2–4 programs side-by-side with aligned metrics (rates, turnaround, collateral, guarantee %).
  - "Copy Call Pitch" button writes formatted borrower proposal pitch to system clipboard with correct numbers.

### 4. Dynamic CSV Rate Sheet Upload & Zero Stale State
- **User Journey**: Rep uploads a newly published monthly rate sheet CSV during a shift.
- **Automated Assertions**:
  - File input accepts `.csv` files via file picker and triggers client-side parsing.
  - Success feedback pill confirms loaded program count and active filename.
  - Active program list replaces previous dataset with zero stale lender records lingering in state or DOM.
  - "Reset to Latest" button resets state back to the default latest date-versioned file in `data/`.

### 5. Resilient Error Handling & Corrupted CSV Ingestion
- **User Journey**: Rep mistakenly uploads a malformed CSV with missing headers or inverted numeric ranges.
- **Automated Assertions**:
  - Non-blocking error pill displays descriptive parse diagnostics.
  - UI remains fully interactive with the previous valid dataset intact (zero white-screen crashes).

### 6. Keyboard Navigation & Live Call Speed
- **User Journey**: Rep navigates the entire intake triage, filters, and comparison actions exclusively via keyboard (`Tab`, `Enter`, arrows).
- **Automated Assertions**:
  - Logical tab order across all interactive triage inputs.
  - Visual focus indicators meet WCAG AA contrast standards.

