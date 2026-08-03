# Blinkit Category Discovery Engine — Project Context

## Purpose of this file

Use this document as the complete handoff context for another AI assistant. The project is a Product Management graduation project for Blinkit, not a production Blinkit product.

Do not expose, request, commit, or reproduce any API keys. API credentials are kept only as GitHub repository secrets.

---

## 1. Project objective

**Company:** Blinkit (quick-commerce, India)

**Strategic goal / North Star Metric:**

> Increase the percentage of Monthly Active Customers who purchase products from at least one new category every month.

The project investigates why regular Blinkit customers repeatedly buy from familiar categories (for example groceries, snacks, beverages, and household essentials) instead of exploring adjacent categories such as personal care, baby, pet, health, beauty, or electronics.

The Discovery Engine is a voice-of-customer research system. It turns public feedback into evidence-backed hypotheses for PM research. It does **not** prove causality or replace customer interviews.

---

## 2. Assignment requirements

The project was required to build an AI-powered discovery system that analyses public feedback at scale from sources such as:

- App Store reviews
- Google Play reviews
- Reddit discussions
- Community forums / news discussions
- Social conversations
- Product reviews
- Quick-commerce discussions

It should help answer:

1. Why do users repeatedly buy from the same categories?
2. What prevents users from exploring new categories?
3. How do users discover products today?
4. What role do habits play in shopping behaviour?
5. What information do users need before trying a new category?
6. What frustrations emerge repeatedly?
7. Which user segments are more likely to experiment?
8. What unmet needs emerge consistently across discussions?

Part 2 of the assignment requires 5–6 user interviews to validate the hypotheses discovered through public feedback.

---

## 3. Current evidence corpus

Current total: **23,292 source-labelled public feedback records**.

| Dashboard source category | Review/discussion count |
|---|---:|
| Google Play (India) | 20,123 |
| Apple App Store (IN) — dashboard grouping of all Apple storefront records | 2,500 |
| Q-Commerce discussions | 239 |
| Forum / News discussions | 239 |
| Product reviews | 141 |
| Reddit discussions | 25 |
| Social conversations | 25 |

The Apple App Store dashboard category is intentionally displayed as **Apple App Store (IN)** per project-owner preference. Country-level Apple storefront labels are retained in the raw Review Library for auditability.

The external CSV import supplied 669 records split across Q-Commerce, Forum/News, Product Review, Reddit, and Social.

---

## 4. Current analysis status

The dashboard currently shows **1,298 in-scope signals** after screening.

There are two layers of screening:

1. **Keyword/theme screen** to identify potentially relevant feedback.
2. **LLM screen** using Gemini and Groq to make a more contextual relevance decision, assign themes, sentiment, segment, categories, barrier, and a short reason.

The first batch of imported external records has been AI-screened:

- 150 imported records screened by LLM
- 80 via Gemini
- 70 via Groq
- 29 marked AI-relevant in that batch
- Remaining imported records are scheduled for daily LLM batches

LLM output is a research aid. It must be described as an evidence-based classification, not as ground truth.

---

## 5. Main themes used by the discovery engine

1. **Trial confidence**
   - Quality, authenticity, freshness, expiry, product ratings, price confidence, damaged/wrong product, and recovery/return concerns.

2. **Availability or substitution**
   - Stock availability, out-of-stock, cancellation, substitution, missing products, and delivery fulfilment confidence.

3. **Category or product exploration**
   - Mentions of product range, variety, brand, groceries, snacks, personal care, baby, pet, household, cleaning, electronics, medicine, etc.

4. **Habit or repeat purchase**
   - Reorder, repeat, regular, daily, weekly, routine, usual purchase behaviour.

5. **Discovery or navigation**
   - Browse, discover, category, recommendations, suggestions, homepage, navigation, app layout, scrolling, search behaviour.

---

## 6. Main PM insight and hypotheses

### Strongest opportunity hypothesis

> Routine Blinkit customers do not explore new categories because they lack confidence that unfamiliar products will be relevant, available, good quality, and easy to recover from if something goes wrong.

### Supporting hypotheses

- Routine replenishment creates convenience, but can lock users into existing shopping habits.
- Customers are more likely to try a new category when it is attached to an existing shopping mission or reorder.
- Relevant adjacent-category prompts may work better than presenting a large category grid.
- Trust signals—rating, verified quality, price clarity, expiry/freshness, availability confidence, and easy return/refund recovery—can reduce trial risk.
- Familiar-product plus adjacent-category trial bundles may make experimentation feel lower-risk.
- Likely experiment-prone segments include first-time users, multi-category users, urgent-need users, life-event shoppers, and category-specific shoppers.

### Important research disclaimer

These are hypotheses supported by public feedback patterns. They are **not proven causal conclusions**. Validate through 5–6 structured interviews with the chosen target segment.

---

## 7. Recommended target segment for interviews

**Routine Blinkit customers** who frequently buy groceries, snacks, beverages, or household essentials but have not recently purchased from an adjacent category.

Suggested interview goals:

- Understand actual reorder and routine behaviours.
- Identify why customers do not try adjacent categories.
- Learn what information builds confidence before first trial.
- Test mission-led recommendations and low-risk bundles.
- Identify whether user segments differ in willingness to explore.

---

## 8. Current dashboard experience

### Main merged dashboard

File: `index.html`

It contains:

- Overview and North Star context
- Corpus and in-scope totals
- Theme evidence chart
- Source coverage chart
- Rating mix chart
- Priority Radar / evidence-ranked opportunity queue
- Evidence-retrieval PM Copilot

### Separate Review Library

File: `review-library.html`

It contains:

- All downloaded records; no raw feedback is deleted
- Search and filters by source, study status, and screening reason
- Source links
- PM question box with retrieval-based evidence excerpts
- Summary: 2,500 Apple App Store (IN) + 20,123 Google Play + 669 external discussions

### Supporting pages retained in the project

- `discovery-lens.html`
- `priority-radar.html`
- `evidence-library.html`
- `copilot.html`
- `blinkit-dashboard.html` (older dashboard version)

The user’s preferred presentation is the merged `index.html` dashboard, with `review-library.html` remaining separate.

---

## 9. Automation and AI screening

### GitHub repository

`https://github.com/thegeneralistpm-blip/gradp2`

### Workflows

1. `.github/workflows/weekly-review-collection.yml`
   - Weekly public-review collection
   - Refreshes dashboard data
   - Runs a free-tier-safe AI batch if secrets exist
   - Archives a snapshot and detects emerging themes

2. `.github/workflows/daily-ai-review-screening.yml`
   - Daily AI classification of new/remaining relevant reviews
   - Uses batches of 200 by default

3. `.github/workflows/external-llm-screening.yml`
   - Daily screening of imported external discussions
   - Uses batches of 150 to manage Gemini/Groq free-tier limits
   - Filters to Reddit, Forum / News, Social, Product Review, and Q-Commerce sources

### Secrets

GitHub Actions uses repository secret names:

- `GEMINI`
- `GROQ`

The workflows map them privately to the environment variables expected by the classifier. Never print or share secret values.

### Key automation rule

Already screened review IDs are skipped. The system is intended to screen **new** reviews rather than repeatedly spending API quota on old ones.

---

## 10. Important project files

| File | Purpose |
|---|---|
| `server.js` | Simple Node static server for Railway deployment |
| `package.json` | Project scripts |
| `screen-reviews.js` | Keyword screening and source merge |
| `ai-classify-reviews.js` | Gemini/Groq LLM classification |
| `import-codex-export.js` | Imports CSV external discussions |
| `build-merged-dashboard.js` | Builds main merged dashboard |
| `build-review-library.js` | Builds Review Library |
| `build-blinkit-suite.js` | Builds supporting dashboard pages |
| `data/review_screening.json` | Screened records used by dashboards |
| `data/ai_classifications.json` | Persisted AI classification results |
| `data/screening_report.json` | Latest counts, themes and source breakdown |
| `data/blinkit_external_discussions.json` | Imported external discussions |
| `.env.example` | Variable names only, with no real secrets |

---

## 11. Deployment status

The project is GitHub-pushed and ready for Railway.

For Railway:

- Deploy from GitHub repository `thegeneralistpm-blip/gradp2`
- Build command: `npm ci`
- Start command: `npm start`
- Generate a public Railway domain under Networking

`*.railway.internal` is an internal Railway service hostname and cannot be opened in a normal browser. Use the generated public `*.up.railway.app` domain instead.

Do not add Gemini/Groq keys to Railway unless a future Railway-hosted backend actually needs to make LLM calls. Current scheduled AI collection/screening runs in GitHub Actions with GitHub Secrets.

---

## 12. Presentation guidance

The final deck must be a maximum of 10 slides and should not contain the Fellow’s name.

Recommended narrative:

1. Title / project context
2. North Star Metric and business opportunity
3. Routine shopping problem
4. Why this matters for Blinkit
5. Research coverage and methodology
6. Key themes and evidence
7. Target segment
8. Problem statement
9. Solution directions / hypotheses
10. Interview validation plan and success metrics

Use Blinkit-inspired colours:

- Background: `#F7F7F2`
- Heading: `#20201C`
- Body text: `#55554F`
- Yellow accent: `#F8D34B`
- Opportunity/positive: `#087852`
- Barrier/risk: `#F28C28`
- Dark footer/emphasis: `#272723`

Avoid white text on yellow. Use labels as well as colour in charts so they remain readable for colour-blind viewers.

---

## 13. How to communicate findings

Use this phrasing:

> “The Discovery Engine surfaced evidence-backed hypotheses from public feedback. These insights are directional and will be validated through primary interviews.”

Avoid claiming:

- “Reviews prove that customers behave this way.”
- “The LLM has proven the cause.”
- “This is a final solution.”

The correct PM flow is:

**Public feedback → pattern detection → hypothesis → user interviews → validated problem → solution experiment.**
