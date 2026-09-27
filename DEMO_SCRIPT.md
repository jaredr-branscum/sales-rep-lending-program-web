# NEWITY SBA Lender Comparison Tool — 5-Minute Demo Script

> **Target Audience**: NEWITY Sales Representatives & Sales Managers  
> **Target Recording Duration**: 5:00 Minutes (Structured with visual cues and speaker narration)  
> **Presenter Persona**: Product Engineer delivering a business-focused walkthrough  

---

## Screen Recording Quick-Check Checklist Before Pressing Record

- [ ] Dev server running at `http://localhost:5173` (browser window clean, zoom at 100% or 110%).
- [ ] Reset to default dataset (`sample_lenders_2026-08.csv` loaded with 49 programs).
- [ ] Default triage values loaded ($150,000, 2 Years in Business, 680 Credit Score, All Industries, Collateral Available).
- [ ] Have sample rate sheet file `sample_lenders_2026-04.csv` ready on Desktop/Downloads for upload demonstration.
- [ ] Microphone tested; recording tool configured (Loom, OBS, or QuickTime).

---

## Segment 1: The Core Problem & V1 Solution (0:00 – 0:45)

### Visual Action
> Show the NEWITY tool full-screen at `http://localhost:5173`. Mouse cursor hovers gently over the clean interface—highlighting the sticky triage header, live counter badges, and the responsive lender cards below.

### Speaker Script (Narration)
> *"Hi everyone! If you’ve ever fielded a live phone call from a time-crunched small business owner looking for an SBA loan, you know the pressure. You’re on the phone, trying to listen, while frantically flipping between 30-page PDFs, internal wikis, and a 50-row monthly lender spreadsheet.*
> 
> *Dead air kills deals. Fumbling through spreadsheets leads to misquoted terms, and new reps take weeks just to learn the lender landscape.*
> 
> *To solve this, I built the **NEWITY SBA Lender Matching Comparison Tool**. It is a single-screen, zero-latency qualification engine designed specifically for the live phone call workflow. You enter borrower facts as they speak, and with zero page reloads it shows which lenders qualify, explains borderline near-misses, highlights freshly updated rates, and lets you generate a polished borrower proposal pitch before hanging up."*

---

## Segment 2: Live Walkthrough with Call Scenario (0:45 – 2:30)

### Visual Action
> **0:45**: Point cursor to the top sticky **Triage Bar**.

### Speaker Script (Narration)
> *"Let’s walk through a realistic call scenario. A borrower calls in: Dr. Sarah runs an established medical clinic. She needs **$150,000** for new diagnostic equipment.*
> 
> *As she speaks, I type `$150,000` into **Loan Needed**. She mentions she’s been in business for **2 years**. I tab over to **Years in Business** and enter `2`.*
> 
> *Next, I ask about credit. If she gives me an exact score like `680`, I can type it directly. But if she just says 'I have good credit,' look right here—we built **1-click Credit Tier shortcuts**. Clicking **'Good'** instantly sets 680; **'Fair'** sets 620; **'Exc'** sets 740. Let's select **'Good'**.*
> 
> *For Industry, I choose **'Healthcare'** from our SBA dropdown, and keep **Collateral Available** toggled on."*

---

### Visual Action
> **1:15**: Gesture cursor across the header badges and down to the top card in the Qualified grid.

### Speaker Script (Narration)
> *"Looking at the results: our triage badges show **26 Qualified**, **0 Near-Misses**, and **23 Ineligible**.*
> 
> *Notice our ranking logic: **clean programs without special requirements are automatically prioritized at the very top**. On a live call, reps don’t want to wade through lenders demanding 20% equity injections or 7 years of clean bankruptcy lookbacks unless necessary. Frictionless programs like Delta Commercial Bank and Elevate Business Bank appear first.*
> 
> *Look at the **Rate Range** metric box on Delta Commercial: notice that bright blue badge—**'Rate Updated'**. Our system dynamically detects that this rate was updated in the active August cycle, while older, unchanged programs display neutral gray dates. Reps never have to guess whether they're quoting a fresh rate."*

---

### Visual Action
> **1:45**: Adjust Loan Needed to `$450,000` and Years in Business to `1.5` to show Near-Miss and Ineligible states.

### Speaker Script (Narration)
> *"Now, what if Dr. Sarah's situation was slightly tighter? Say she needs **$450,000** and has only been in business for **1.5 years**.*
> 
> *Immediately, the engine adapts. We now have **Near-Misses**. Clicking the **Near-Misses tab**, we see actionable gap coaching. For example, for First National Bank, it explicitly flags: **'Need +6 months in business'**.*
> 
> *If we check **Ineligible**, it doesn't just hide lenders—it shows the exact failure criteria: *'Min 2.0 yrs in business required'* or *'Max loan $350k exceeded'*. You never have to second-guess why a bank didn't match."*

---

### Visual Action
> **2:05**: Reset inputs back to Dr. Sarah's initial $150k scenario. Check the **"Select for Comparison"** checkbox on 3 qualified lenders. The bottom drawer slides up. Click **"Compare (3) Programs"**.

### Speaker Script (Narration)
> *"Back to Dr. Sarah's $150k deal: she asks, 'What are my top options side-by-side?'*
> 
> *I simply click **'Select for Comparison'** on three top lenders. Notice this floating comparison drawer appears at the bottom. Clicking **'Compare (3) Programs'** opens our side-by-side modal table.*
> 
> *Here, Dr. Sarah and I can evaluate interest rates, turnaround speed—like 7 days versus 30 days—SBA guarantee percentages, and collateral side-by-side.*
> 
> *And right before wrapping up the call, I click this button: **'Copy Call Pitch'**. It instantly generates a clean, executive markdown summary of all three options and copies it to my clipboard, ready to paste straight into an email or CRM note."*

---

### Visual Action
> **2:20**: Close modal. Click **"Upload CSV"** in the top navigation. Select a different CSV (e.g., `sample_lenders_2026-04.csv`).

### Speaker Script (Narration)
> *"Finally, when our lender relations team drops a new rate sheet, reps don't have to wait for an engineer to redeploy code. I click **'Upload CSV'**, select the new monthly file, and boom—toast notification confirms it loaded, the active badge updates, and all programs refresh in real time with zero stale data. If I ever want to revert, I just click **'Reset to Latest'**."*

---

## Segment 3: Scope Trade-offs: What We Built vs. Cut (2:30 – 3:30)

### Visual Action
> Return to the main grid. Scroll naturally as you discuss architecture and trade-offs.

### Speaker Script (Narration)
> *"Now, let's talk about scope control and the deliberate engineering trade-offs we made for V1.*
> 
> *My goal was to solve the live-call bottleneck within a 3-hour build budget. Here is what I chose to build and why:*
> 
> 1. **100% Client-Side In-Memory Engine**: *I deliberately bypassed a backend server, database, and network API layer. For a ~50-row partner rate sheet, making network requests during a phone call introduces latency, spin-wheels, and offline failure modes. By bundling the data client-side and using Vite's dynamic globbing, calculations happen in sub-milliseconds.*
> 2. **Deterministic Qualification vs. Machine Learning**: *I explicitly cut AI or algorithmic scoring models. On financial borrower calls, compliance and trust require 100% explainable math. Reps must know exactly why a lender matched or disqualified.*
> 3. **Zero Login Barriers**: *I cut user authentication and role management. Sales reps need instant access when picking up a ringing call—every login screen is friction.*
> 4. **Clipboard Pitch Export vs. Backend PDF Generation**: *Building server-side PDF generation or direct email dispatch was deferred to V2. Instead, I delivered 90% of the user value in V1 by creating the instant 'Copy Call Pitch' clipboard export.*
> 5. **Client-Side CSV Upload**: *Instead of waiting for a complex admin portal in V2, I brought CSV ingestion into V1 so reps can field calls against fresh rate sheets immediately."*

---

## Segment 4: QA & Testing Strategy (3:30 – 4:15)

### Visual Action
> Briefly switch terminal or screen to show `vitest run` test results passing cleanly (36 passed).

### Speaker Script (Narration)
> *"Before declaring this ready for sales reps, how did I test it?*
> 
> *The test suite consists of **36 automated unit and integration tests** running on Vitest across four core domain suites:*
> 
> 1. **Match Engine Tests**: *Validate exact qualification, boundary conditions on loan limits, credit tolerances (15 points), tenure tolerances (6 months), and clean-program prioritization.*
> 2. **CSV Parser Boundary & Sanitization Tests**: *Verify RFC-4180 parsing, quoted comma handling, inverted loan range recovery, and invalid row isolation—ensuring bad rows in a spreadsheet never crash the app.*
> 3. **Dynamic Discovery & Zero-Stale State Tests**: *Ensure that when a new CSV is uploaded or discovered, all previous programs are fully purged from memory so reps never quote stale lender rates.*
> 4. **Rate Freshness Tests**: *Verify that my relative month-based rate update helper accurately flags active-cycle updates without brittle date hardcoding.*
> 
> *For V2, I have documented an **End-to-End Playwright test plan** in the scope document covering cross-browser automation, live typing reactivity, and keyboard-only call speed."*

---

## Segment 5: Honest Self-Assessment & V2 Roadmap (4:15 – 5:00)

### Visual Action
> Bring the web app back to full view. Open the comparison drawer to highlight the UI.

### Speaker Script (Narration)
> *"To close with an honest engineering self-assessment—what's solid, what's fragile, and what's next:*
> 
> **What’s Solid**:
> - *The live matching speed and zero-latency UI reactivity are highly performant.*
> - *The clean-program ranking and near-miss delta explanations directly solve sales rep cognitive load.*
> - *The dynamic CSV discovery and non-fragile dataset pipeline handle rate sheet updates smoothly.*
> 
> **What’s Rough & Needs Attention**:
> - *Currently, active state lives in React memory. If a rep accidentally refreshes their browser mid-call, their typed criteria and pinned comparison drawer reset. Adding LocalStorage or URL query parameter persistence would solve this problem.*
> - *While desktop views are clean, the interface could be optimized for mobile devices and tablets.*
> 
> **What’s Next in V2**:
> 1. *Full CI/CD pipeline automation with preview deployments.*
> 2. *Automated co-branded PDF generation and direct email dispatch to borrowers.*
> 3. *Sales manager recommendation analytics to track which loan programs are pitched most often.*
> 4. *Comprehensive keyboard shortcuts (`Tab` + numbers) for faster data entry.*
> 
> *This V1 tool delivers an immediate, measurable lift to call conversion and rep onboarding speed. Thank you, and I look forward to your feedback!"*

---

## Quick Reference Summary Table for Presenter

| Timing | Segment | Key Talking Points | Screen Action |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:45** | Problem & V1 Solution | Live call pressure, dead air, flipping between docs, sub-second single-screen solution. | Full-screen app view, hover on triage bar & cards. |
| **0:45 – 2:30** | Live Call Walkthrough | Dr. Sarah ($150k, 2 yrs, Good credit), 1-click tier chips, clean program priority, Rate Updated badge, near-miss gaps, comparison drawer, Copy Call Pitch, CSV upload. | Type inputs, toggle filters, pin 3 lenders, open compare modal, copy pitch, upload CSV. |
| **2:30 – 3:30** | Scope Trade-offs | Client-side in-memory vs backend DB, explainable rules vs ML, no login barrier, pitch copy vs PDF. | Scroll comparison grid, show responsive layout. |
| **3:30 – 4:15** | QA & Testing Plan | 36 Vitest unit tests, boundary recovery, zero-stale state verification, Playwright V2 roadmap. | Show test suite passing in terminal or speak to metrics. |
| **4:15 – 5:00** | Self-Assessment & V2 | Solid: speed, clean ranking, parser. Rough: page refresh state loss, mobile table. V2: CI/CD, PDF, analytics. | Return to app, close modal, summarize impact. |
