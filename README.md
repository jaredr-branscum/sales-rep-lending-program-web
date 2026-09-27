# NEWITY SBA Lender Comparison & Live Deal Triage Tool

> **A real-time, zero-latency SBA loan qualification and comparison assistant built for NEWITY sales representatives on live borrower calls.**

---

## Quick Start (Run Locally in Under 5 Minutes)

This tool is designed to run directly on your computer in your web browser. No complex databases, server setup, or user logins required!

### Prerequisites

You only need **Node.js** installed on your computer.
- If you don't have it yet, download and install the **LTS version (v24.21.0)** from [nodejs.org](https://nodejs.org/) (takes ~2 minutes).

---

### Step 1: Open Terminal / Command Prompt

- **Windows**: Press `Win + S`, type `PowerShell` or `cmd`, and press Enter.
- **Mac**: Press `Cmd + Space`, type `Terminal`, and press Enter.

Navigate to the project folder:
```bash
cd path/to/sales-rep-lending-program-web
```

---

### Step 2: Install Dependencies

Run this single command to download the required components:
```bash
npm install
```
*(This only needs to be run once).*

---

### Step 3: Launch the Application

Start the local app with:
```bash
npm run dev
```

You will see output similar to:
```text
  VITE v6.x.x  ready in 250 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open your browser (Chrome, Edge, Safari, or Firefox) and navigate to:
👉 **[http://localhost:5173](http://localhost:5173)**

*To stop the application at any time, return to your terminal window and press `Ctrl + C`.*

---

## Sales Rep Quick-Reference Guide (Live Call Workflow)

When speaking with a small business borrower, follow this fast 5-step flow:

```
[1. Enter Borrower Criteria] ➔ [2. Review Qualified Programs] ➔ [3. Compare Top Fits] ➔ [4. Copy Pitch]
```

### 1. Sticky Triage Bar (Top of Screen)
As the borrower describes their situation, enter their numbers into the header controls:
- **Loan Needed ($)**: Type the requested amount (e.g. `150000`) or use clean formatted numbers.
- **Years in Business**: Enter how long the company has been operating (supports half-years, e.g. `1.5`).
- **Credit Score & 1-Click Tiers**: 
  - If the borrower knows their score, type it directly (e.g. `680`).
  - If they only know their qualitative standing, click the quick tier buttons:
    - **`Fair`**: Sets score to `620`
    - **`Good`**: Sets score to `680`
    - **`Exc`**: Sets score to `740`
- **Industry**: Select from the SBA dropdown (e.g. `Manufacturing`, `Healthcare`, `Restaurant/Food Service`, or `All Industries`).
- **Collateral**: Toggle whether the borrower has real estate or physical equipment available.

---

### 2. Live Match Status & Smart Re-ranking
The screen updates **instantaneously (< 50ms)** with zero lag:
- **`Qualified` (Green Badge)**: The borrower satisfies 100% of minimum requirements for loan amount, credit score, tenure, industry, and collateral.
- **Clean Programs Prioritized**: Programs **without special restrictions** (such as owner injections, clean tax history, or positive cash flow requirements) are automatically promoted to the very top so you can quote frictionless loans first.
- **`Near-Miss` (Amber Badge)**: The borrower is within striking distance (within 15% of loan range, 15 credit score points, or 6 months of tenure). Actionable coaching tips are clearly shown (e.g., *"Need +6 months in business"*, *"Within 15 pts of min credit"*).
- **`Ineligible` (Slate Badge)**: Displays the exact disqualifying reasons (e.g., *"Min loan $500k exceeded"*, *"Insufficient credit score"*) so you never have to guess why a lender was ruled out.

---

### 3. Spotting Fresh Rate Updates
Lenders update rate sheets periodically:
- **`Rate Updated` Badge**: A prominent blue badge appears on any program whose interest rate was refreshed during the active monthly cycle.
- **Last Updated Date**: Every card displays a clear timestamp (e.g., `Updated 8/14/2026`) in the card footer.
- **Active Dataset Indicator**: The top navigation displays which monthly rate sheet is currently loaded (e.g., `sample_lenders_2026-08.csv`) with a live status indicator.

---

### 4. Side-by-Side Comparison (Pinning Up to 4 Programs)
1. Click **"Select for Comparison"** on any 2 to 4 lender cards.
2. A floating bottom drawer appears displaying the pinned programs.
3. Click **"Compare Programs"** to open a side-by-side comparison modal table showing:
   - Interest rate range
   - Turnaround speed in business days
   - Maximum loan amount and term length
   - SBA guarantee percentage
   - Collateral and special requirements

---

### 5. Instant Borrower Proposal Pitch ("Copy Call Pitch")
Inside the comparison modal, click **"Copy Call Pitch"**:
- An executive markdown summary formatted with all compared program rates, terms, and turnaround times is instantly copied to your clipboard.
- Paste it directly into your CRM call notes, Slack, or a follow-up email to the borrower before ending the call!

---

### 6. Ingesting New Monthly Rate Sheets
When a new monthly rate sheet arrives from partner banks:
1. Click the blue **"Upload CSV"** button in the top right header.
2. Select the `.csv` file from your computer.
3. The system instantly parses the new rates, refreshes the active programs, and purges all stale data with zero page reload.
4. Click **"Reset to Latest"** at any time to return to the latest project bundled partner dataset.

---

## Technical Overview (For Engineering / Evaluators)

| Area | Technology |
| :--- | :--- |
| **Framework** | React 19 + TypeScript + Vite |
| **Styling** | Tailwind CSS (NEWITY navy, slate, blue, and emerald palette) |
| **Architecture** | Client-Side In-Memory Engine adhering to **SOLID** principles |
| **Parsing** | Resilient RFC-4180 CSV tokenizer with fallback boundary recovery |
| **Dynamic Globbing** | `import.meta.glob('/data/*.csv')` with chronological date sorting |
| **Unit Testing** | Vitest (36 automated tests covering parser, matching rules, and refresh pipeline) |

### Running the Test Suite
```bash
npm test
```

### Production Build
```bash
npm run build
```

---

## Project Structure

```
sales-rep-lending-program-web/
├── data/                               # Date-versioned lender CSV rate sheets
│   ├── sample_lenders_2026-02.csv
│   ├── sample_lenders_2026-03.csv
│   ├── sample_lenders_2026-04.csv
│   └── sample_lenders_2026-08.csv      # Latest active default dataset
├── src/
│   ├── components/
│   │   ├── TriageBar.tsx               # Sticky borrower intake controls & 1-click tier chips
│   │   ├── LenderCard.tsx              # Program comparison card, metric grid & rate updated flag
│   │   ├── ComparisonDrawer.tsx        # Floating bar, comparison modal table & pitch generator
│   │   └── tests/
│   │       └── lenderCard.test.ts      # Tests for date freshness and currency formatting
│   ├── domain/
│   │   ├── matchEngine.ts              # Deterministic qualification & tolerance calculations
│   │   └── tests/
│   │       └── matchEngine.test.ts     # Match engine unit tests
│   ├── services/
│   │   ├── csvParser.ts                # Dynamic CSV ingestion & chronological discovery
│   │   └── tests/
│   │       ├── csvParser.test.ts       # CSV tokenizer & boundary recovery tests
│   │       └── datasetRefresh.test.ts  # Upload pipeline & zero-stale state tests
│   ├── types/
│   │   └── lender.ts                   # Strict TypeScript domain interfaces
│   ├── App.tsx                         # Main state coordinator & filter/sort engine
│   └── main.tsx                        # React application root
├── SCOPE_PLAN.md                       # Persona, scope trade-offs, architecture & Playwright QA strategy
├── package.json
└── vite.config.ts
```

---

## Troubleshooting

- **Port 5173 is already in use**:
  Vite will automatically suggest port 5174 or 5175. Simply open the URL shown in your terminal.
- **Node.js is not recognized**:
  Restart your terminal or command prompt after installing Node.js so your system path refreshes.
- **Accidentally uploaded the wrong CSV**:
  Click the **"Reset to Latest"** button in the top navigation bar to restore the default rate sheet immediately.
