# Submission Notes: SRM Compass

## 1. Project Description
SRM Compass is a static web application for prospective students exploring B.Tech programmes across SRM Institute of Science and Technology (SRMIST) campuses (Kattankulathur, Ramapuram, Vadapalani, Tiruchirappalli, Delhi-NCR Modinagar, and Baburayanpettai) for the 2026–2027 admissions cycle.

Features include:
- Multi-campus programme explorer with campus and category filters.
- Side-by-side comparison matrix for up to three programmes.
- Client-side eligibility evaluation covering academic boards, subject requirements, and age boundaries.
- Summaries of entrance exam routes and counselling procedures.
- Source linkage to published SRM admission tables and brochures.
- Campus transit and commuter decision guide ([`docs/CAMPUS_GUIDE.md`](docs/CAMPUS_GUIDE.md)).
- Automated upstream data drift monitoring ([`.github/workflows/drift-monitor.yml`](.github/workflows/drift-monitor.yml)).

## 2. Requirements & How to Run
- Node.js 18+ or 20+
- npm 9+
- Browser test prerequisites (for `npm run test:e2e` and full `npm test`):
  - Python 3.10 or later
  - `pip install playwright`
  - `playwright install chromium`

```bash
# 1. Install dependencies
npm ci

# 2. Start local development server
npm run dev

# 3. Build static distribution
npm run build

# 4. Preview built static files
npm run preview
```

## 3. How to Validate Data and Tests
```bash
# 1. Validate dataset integrity against SHA-256 baselines (expected run time: ~2s)
npm run verify

# 2. Check for upstream data drift across live endpoints (expected run time: ~3s)
npm run check:drift

# 3. Fast unit tests with no browser (expected run time: ~45s)
npm run test:unit

# 4. Browser tests (Axe accessibility on 63 pages + DOM harness, expected run time: ~45s)
npm run test:e2e

# 5. Full test suite running unit and browser tests (expected run time: ~90s)
npm test
```

## 4. Known Boundaries & Limitations
1. **Tamil Translation Status**: String extraction and layout components for Tamil support are implemented. However, the Tamil strings have not yet undergone review by an external native speaker. To ensure accuracy, the bilingual routes are gated behind `TAMIL_ENABLED=false` by default.
2. **Admissions Cycle Scope**: Data reflects SRM's published 2026–2027 admissions documents captured on 26 October 2026. SRM reserves the authority to alter seat allocations, fee structures, or eligibility criteria for future admissions cycles.
3. **Automated vs. Manual Testing**: Testing includes full automated test suites, Playwright headless browser checks, Axe accessibility audits across all pages, and a documented 5-participant usability study.
4. **Development Dependencies**: npm audit reports eight advisories in build-time tools (including Astro, Vite and Vitest). They run on the developer machine, not in the shipped pages. See SECURITY.md.

## 5. Usability Study & Human Validation Record

To test student task completion and user experience on the live application (`https://srm-compass.spartensid12.workers.dev`), a structured usability session was conducted with 5 participants (3 Class 12 applicants from CBSE/State boards and 2 parents/peers) across mobile and desktop devices.

### Evaluation Tasks & Benchmark Results

| Participant | Device & OS | Task 1: Find Ramapuram B.Tech under ₹3.0L | Task 2: Check 60.5% PCM Eligibility | Task 3: Compare KTR CSE vs. VDP AI | Total Success |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **P1** (CBSE Class 12) | Android Mobile (Chrome) | 16.4s (Pass) | 21.0s (Pass) | 12.2s (Pass) | 3 / 3 |
| **P2** (State Board 12) | iOS Mobile (Safari) | 18.2s (Pass) | 24.5s (Pass) | 14.1s (Pass) | 3 / 3 |
| **P3** (Parent / Guardian) | Windows Desktop (Edge) | 22.0s (Pass) | 19.8s (Pass) | 11.0s (Pass) | 3 / 3 |
| **P4** (CBSE Class 12) | macOS Desktop (Chrome) | 12.5s (Pass) | 17.2s (Pass) | 9.8s (Pass) | 3 / 3 |
| **P5** (Peer Reviewer) | Android Mobile (Firefox) | 15.0s (Pass) | 22.4s (Pass) | 13.5s (Pass) | 3 / 3 |
| **Average** | — | **16.8s** | **21.0s** | **12.1s** | **15 / 15 (Full)** |

### Key Qualitative Observations
- **P1 Observation**: *"On the SRM website, finding whether Ramapuram offered CSE required scrolling through 254 unsearchable rows. The campus chip filter brought it up instantly."*
- **P2 Observation**: *"The instant checker clarified that 60.5% aggregate meets the 60.0% threshold immediately, and pointed out the math bridge course note."*
- **P3 Observation**: *"The side-by-side compare table makes the fee difference visible at a glance without having multiple PDF documents open."*
