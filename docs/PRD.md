# BudgetAI — Product Requirements Document

**Version:** 2.0  
**Date:** 2026-04-04  
**Status:** Approved — Ready for Implementation  
**Repo:** https://github.com/ASP25SCM06V/BudgetAI  

---

## 1. Executive Summary

BudgetAI is an AI-powered personal finance intelligence platform that connects your bank accounts, automatically scans your Gmail for financial activity, and gives you a complete picture of your money — with actionable, kind AI coaching. It beats Rocket Money by combining bank + email data sources, offering a receipt splitter, a live financial health score, autonomous background agents, and credit card management — all in a premium dark UI.

**Tagline:** *Your money, understood.*

---

## 2. Problem Statement

Existing personal finance tools (Rocket Money, Mint, YNAB) have critical gaps:

| Gap | Impact |
|-----|--------|
| Only read bank data — miss email receipts, subscriptions, insurance | Incomplete financial picture |
| Passive reports — no proactive AI guidance | User has to interpret data themselves |
| No receipt splitting | Group expenses handled separately |
| Subscription detection is manual or paid tier | Users keep paying for unused services |
| No credit card strategy | Users don't know which card to pay first |
| Rude/gamified shaming tone | Disengages users who need help most |

BudgetAI solves all six.

---

## 3. Target Users

- **Primary:** 22–35 year olds managing finances independently for the first time
- **Secondary:** Households tracking shared expenses and splitting bills
- **Tertiary:** Anyone who wants to cancel unused subscriptions and improve credit

---

## 4. Design System

### 4.1 Brand Identity
- **Name:** BudgetAI
- **Tone:** Warm, smart, empowering — never rude, never shaming
- **AI Persona:** "Aria" — your financial coach, not a villain

### 4.2 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0A0A0F` | Page background |
| `--bg-surface` | `#111118` | Cards, panels |
| `--bg-elevated` | `#1a1a2e` | Active states, inputs |
| `--accent-primary` | `#6366F1` | Primary CTA, active nav, highlights |
| `--accent-secondary` | `#8B5CF6` | Gradient pair with primary |
| `--positive` | `#10B981` | Savings, on-track, success |
| `--warning` | `#F59E0B` | Budget approaching limit |
| `--danger` | `#EF4444` | Over budget, unused subscriptions |
| `--text-primary` | `#F9FAFB` | Headings, key data |
| `--text-secondary` | `#9CA3AF` | Labels, descriptions |
| `--text-muted` | `#6B7280` | Metadata, timestamps |
| `--border` | `#1E1E2E` | Card borders |

### 4.3 Typography
- **Headings:** Syne 800 — large, impactful
- **Body:** DM Sans 400/500/700 — readable, modern
- **Mono:** JetBrains Mono — code/amounts in scheduler display

### 4.4 UX Principles
1. **Smooth scrolling** — CSS `scroll-behavior: smooth` + framer-motion transitions on all page changes
2. **Skeleton loaders** — Every card shows animated shimmer while data loads, never blank screens
3. **Session persistence** — All state saved to localStorage, browser refresh never resets the app
4. **Mobile responsive** — Sidebar collapses to bottom tab bar on screens < 768px
5. **Micro-animations** — Progress bars animate on mount, numbers count up, cards slide in staggered
6. **Toast notifications** — Non-blocking toasts for success/error states, no modal interruptions
7. **Error boundaries** — Every page wrapped, graceful fallback if data is missing

---

## 5. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React 18 + Vite)              │
│  Landing → Dashboard → AI Coach → Subscriptions → Budgets   │
│  Split Receipt → Credit Cards                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────────────┐
│                    SERVER (Node/Express ES Modules)           │
│                                                               │
│  Routes: plaid · ai · auth · gmail · split · insights        │
│          subscriptions · health-score · credit-cards         │
│                                                               │
│  Services: claudeService · plaidService · gmailService       │
│            splitService · subscriptionService                │
│            healthScoreService · creditCardService            │
│                                                               │
│  Scheduler: node-cron → daily 6AM scan                      │
│             Gmail → subscriptions → insights → health score  │
└──────────────────────┬──────────────────────────────────────┘
                       │
      ┌────────────────┼────────────────┐
      ▼                ▼                ▼
  Plaid API       Claude API      Gmail API
  (bank txns)   (AI analysis)   (email scan)
```

### 5.1 In-Memory Store (hackathon scope)
```js
store = {
  accessToken,        // Plaid
  gmailTokens,        // Google OAuth
  transactions,       // merged Plaid + Gmail
  insights,           // daily AI-generated insights array
  healthScore,        // { score, breakdown, updatedAt }
  subscriptions,      // detected recurring charges
  budgets,            // user-set category limits
  creditCards,        // detected cards + utilization
  splits,             // Map<id, SplitRecord>
}
```

---

## 6. Feature Specifications

### 6.1 Daily Background Agent (NEW ARCHITECTURE)

**Overview:** Gmail scanning and AI analysis run as an invisible background scheduler — never surfaced in the UI as a feature. Users just see fresh insights on the dashboard each morning.

**Schedule:** Daily at 6:00 AM via `node-cron`

**Pipeline:**
1. Check if Gmail tokens exist in store
2. Run 7 parallel Gmail queries (orders, credit cards, subscriptions, autopay, insurance, pending, purchases)
3. Deduplicate message IDs across queries
4. Claude extracts `{merchant_name, amount, date, category}` from each email (capped at 40)
5. Merge with Plaid transactions, deduplicate by merchant+amount+date
6. Claude generates 3–5 insight cards (subscription alerts, budget warnings, positive milestones)
7. Subscription service detects recurring patterns
8. Health score recomputed
9. Credit card utilization refreshed
10. All results stored in memory → surfaced on next dashboard load

**Manual trigger:** `POST /api/insights/refresh` — for demo and testing

**Server package needed:** `node-cron`

---

### 6.2 Dashboard (REDESIGNED)

**Route:** `/dashboard`

**Layout:** Sidebar (200px fixed) + main content area

**Sidebar items:**
- 🏠 Dashboard (active)
- 🧠 AI Coach
- 🔄 Subscriptions (badge: count of unused)
- 🎯 Budgets
- 💳 Credit Cards *(new)*
- 🧾 Split Receipt
- Bottom: `● Last synced Xh ago` (small dot, no agent panel)

**Main content sections:**

#### Header
- "Good morning, [Name] 👋"
- Subtitle: "X new insights since yesterday" (or "All caught up")
- Right: date pill + Financial Health Score badge (gradient, shows score/100)

#### Stat Cards Row (4 cards)
| Card | Data | Color |
|------|------|-------|
| Net Worth | Sum of all balances | Green |
| Monthly Spend | Actual vs budget | Amber (warning if >80%) |
| Saved This Month | Actual vs goal | Green |
| Subscriptions | Total/mo + unused count | Red if unused > 0 |

#### AI Insight Cards (from daily scan)
- Staggered slide-in animation on mount
- Types: subscription alert, budget warning, positive milestone, gmail finding
- Each has: icon, title, description, primary action button, dismiss
- Max 5 shown, "See all insights" expands

#### Budget vs Actual (horizontal bar chart)
- Categories: Food, Shopping, Transport, Entertainment, Subscriptions
- Color: green (under), amber (>75%), red (over)
- Budget limit line overlaid
- "Set budget" link per category

#### Recent Transactions (top 10)
- Merchant icon/emoji, name, category, amount, date
- Click expands with AI insight for that transaction
- "Ask Aria about this" quick action

---

### 6.3 Financial Health Score

**Route:** Computed by server, displayed in dashboard header + dedicated section

**Score range:** 0–100

**Claude prompt:**
```
Analyze this user's financial data and return a health score from 0-100.
Factors to consider:
- Savings rate (target >20%) — 30 points max
- Budget adherence (% of categories under limit) — 25 points max  
- Subscription waste (unused subscriptions penalize) — 20 points max
- Spending trend (improving/worsening vs last month) — 15 points max
- Credit utilization (under 30% is good) — 10 points max

Return JSON: {
  "score": number,
  "grade": "Excellent|Good|Fair|Needs Work",
  "breakdown": { "savings": n, "budget": n, "subscriptions": n, "trend": n, "credit": n },
  "top_win": "one sentence about what they're doing well",
  "top_opportunity": "one sentence about the biggest improvement area"
}
```

**Display:** Gradient badge in header, expanded breakdown on hover/click

---

### 6.4 AI Coach "Aria" (REPLACES Villain Chat)

**Route:** `/coach`  
**Previous route:** `/chat` (keep for backwards compatibility, redirect)

**Persona change from previous version:**
- Name: **Aria**
- Tone: Warm, direct, encouraging — like a smart friend who knows finance
- Never shames, never insults, never uses "villain" language
- Proactively opens with a relevant insight based on current data

**System prompt:**
```
You are Aria, a warm and knowledgeable AI financial coach built into BudgetAI.
You have access to the user's spending data, budgets, subscriptions, and financial health score.
Your job is to help them make better financial decisions with specific, actionable advice.
Be encouraging, direct, and friendly. Never shame or mock the user.
Always ground advice in their actual data. Be concise — 2-3 sentences max per response.
When suggesting cuts, explain the annual impact. When praising, be specific.
```

**Opening message:** Generated from user's actual worst_stat + top opportunity from health score

**Features:**
- Multi-turn conversation with full transaction context
- Quick reply suggestions (3 buttons based on current data)
- "Ask about [transaction]" deep-link from dashboard
- Demo mode: 6 pre-written responses covering common scenarios

---

### 6.5 Subscription Radar (REDESIGNED)

**Route:** `/subscriptions`

**Data sources:** Plaid recurring charge detection + Gmail receipt scanning

**Detection logic (Claude):**
```
Analyze these transactions and emails. Identify all recurring charges.
For each, determine: is it active or unused (no usage signals in last 60 days)?
Return JSON array: [{
  name, amount_monthly, last_charged, last_used_signal,
  status: "active"|"unused"|"unknown",
  source: "bank"|"email"|"both",
  category, cancel_url_hint
}]
```

**Page layout:**
- Alert banner: "X unused subscriptions detected — cancel to save $Y/mo"
- Cards per subscription: logo/emoji, name, amount, status badge, last used, CANCEL/KEEP button
- "Annual waste" counter for all unused combined
- Cancellation notes (user can add notes per subscription)

---

### 6.6 Budget vs Actual

**Route:** `/budgets`

**User flow:**
1. First visit: "Set your monthly budgets" — 6 category inputs with AI suggestions
2. AI suggests budget based on last 3 months average + 10% reduction target
3. Dashboard shows live progress bars
4. Alert at 80% of budget: amber warning insight card
5. Alert at 100%: red insight card with Aria suggestion

**Categories:** Food & Dining · Shopping · Transport · Entertainment · Subscriptions · Healthcare · Other

**Server endpoint:** `POST /api/budgets/set`, `GET /api/budgets/status`

---

### 6.7 Credit Card Analysis & Management (NEW FEATURE)

**Route:** `/credit-cards`

**Overview:** BudgetAI detects all credit cards from Plaid transactions and Gmail statements, analyzes utilization, tracks payment due dates, and gives AI-powered payoff strategy.

**Data sources:**
- Plaid: credit card transactions, balances, payment history
- Gmail: statement emails, due date reminders, minimum payment notices

**Page sections:**

#### Card Overview
- Detected cards listed as visual cards (card design with last 4 digits)
- Per card: current balance, credit limit, utilization %, due date, minimum payment
- Utilization color: green (<30%), amber (30-70%), red (>70%)
- Total credit utilization across all cards

#### Payoff Strategy (AI-powered)
Claude analyzes all cards and recommends:
- **Avalanche method**: highest interest first (saves most money)
- **Snowball method**: lowest balance first (fastest wins)
- Shows projected payoff date + total interest for each strategy
- "Aria recommends" badge on the better option for the user's situation

#### Payment Calendar
- Due dates for each card shown on a mini calendar
- Upcoming due dates in the next 7 days highlighted
- "Set reminder" note (informational — no real notifications in hackathon scope)

#### Spending by Card
- Which card is used for what (category breakdown per card)
- Identifies if user is missing cashback opportunities
- "You spent $340 on groceries with Visa (0% cashback) — your Amex gives 3%"

**Server endpoint:** `POST /api/credit-cards/analyze`

**Claude prompt for credit card analysis:**
```
Analyze these credit card transactions and statements. Return JSON:
{
  "cards": [{
    "name": string,
    "last_four": string,
    "estimated_balance": number,
    "estimated_limit": number,
    "utilization_pct": number,
    "next_due_date": string,
    "minimum_payment": number,
    "interest_rate_hint": number | null
  }],
  "payoff_strategy": {
    "avalanche_order": [card names],
    "snowball_order": [card names],
    "recommendation": "avalanche"|"snowball",
    "reason": string
  },
  "top_insight": string
}
```

---

### 6.8 Receipt Splitter (EXISTING — kept as-is)

**Route:** `/split`

No changes from current implementation. Already working.

---

### 6.9 Landing Page (REDESIGNED)

**Changes from SpendShame landing:**
- Logo + wordmark: BudgetAI with ✦ icon (indigo gradient)
- Tagline: "Your money, understood." (replaces "Your money has a villain")
- Consent block: same 3 items but framed positively
- CTA: "Connect My Bank → Get Your Score" (replaces "I Accept — Connect My Bank")
- Demo mode: "Try with sample data" (replaces "Try Demo Mode")
- Removes skull emoji, removes all villain references
- Background: `--bg-primary` dark, same layout

**Post-connect flow:**
1. Plaid Link → success
2. Gmail OAuth popup auto-triggers
3. Both run in parallel
4. Combined: health score computed → navigate to `/dashboard`

---

## 7. New Server Files

| File | Purpose |
|------|---------|
| `server/scheduler.js` | node-cron daily job — orchestrates all background scans |
| `server/services/subscriptionService.js` | Detects recurring charges from transactions + emails |
| `server/services/healthScoreService.js` | Computes 0-100 score via Claude |
| `server/services/creditCardService.js` | Analyzes credit cards, builds payoff strategy |
| `server/routes/insights.js` | GET /api/insights, POST /api/insights/refresh |
| `server/routes/subscriptions.js` | GET /api/subscriptions, PATCH /api/subscriptions/:id |
| `server/routes/budgets.js` | GET/POST /api/budgets |
| `server/routes/credit-cards.js` | POST /api/credit-cards/analyze, GET /api/credit-cards |

---

## 8. New Client Files

| File | Purpose |
|------|---------|
| `client/src/components/Sidebar.jsx` | Persistent sidebar navigation |
| `client/src/components/InsightCard.jsx` | AI insight card with dismiss/action |
| `client/src/components/HealthScoreBadge.jsx` | Animated score badge |
| `client/src/components/BudgetBar.jsx` | Budget vs actual progress bar |
| `client/src/components/SkeletonCard.jsx` | Loading skeleton for cards |
| `client/src/components/Toast.jsx` | Toast notification system |
| `client/src/pages/Dashboard.jsx` | Full redesign — all 6 feature sections |
| `client/src/pages/Landing.jsx` | BudgetAI rebrand |
| `client/src/pages/AICoach.jsx` | Replaces RedemptionChat — Aria persona |
| `client/src/pages/Subscriptions.jsx` | Subscription Radar page |
| `client/src/pages/Budgets.jsx` | Budget setting + tracking |
| `client/src/pages/CreditCards.jsx` | Credit card analysis + payoff strategy |
| `client/src/hooks/useLocalPersist.js` | localStorage persistence hook for all state |
| `client/src/hooks/useToast.js` | Toast notification hook |

---

## 9. Modified Files

| File | Changes |
|------|---------|
| `server/index.js` | Mount new routes + import scheduler |
| `server/store.js` | Add insights, healthScore, subscriptions, budgets, creditCards |
| `server/package.json` | Add node-cron |
| `client/src/App.jsx` | New routes + layout with Sidebar |
| `client/src/context/AppContext.jsx` | Add insights, healthScore, budgets, creditCards, toasts state |
| `client/src/styles/globals.css` | New design tokens, smooth scroll, skeleton animation |
| `client/tailwind.config.js` | Updated color palette (indigo/purple replaces brand red) |

---

## 10. API Endpoints

### New Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/insights` | Returns stored AI insight cards |
| POST | `/api/insights/refresh` | Manually trigger daily scan (demo/dev) |
| GET | `/api/subscriptions` | Returns detected subscriptions |
| PATCH | `/api/subscriptions/:id` | Update subscription status (keep/cancel) |
| GET | `/api/budgets` | Returns user budgets + current spend per category |
| POST | `/api/budgets` | Set/update budget limits |
| GET | `/api/credit-cards` | Returns analyzed credit cards |
| POST | `/api/credit-cards/analyze` | Trigger credit card analysis via Claude |
| GET | `/api/health-score` | Returns current health score |

### Existing Endpoints (unchanged)
- `POST /api/create_link_token`
- `POST /api/exchange_token`
- `POST /api/transactions`
- `POST /api/analyze`
- `POST /api/roast` (repurposed for Aria)
- `POST /api/advice`
- `GET /api/auth/google`
- `GET /api/auth/google/callback`
- `POST /api/gmail/transactions`
- `POST /api/split/extract`
- `POST /api/split/calculate`
- `POST /api/split/save`
- `GET /api/split/:id`
- `PATCH /api/split/:id/pay`

---

## 11. Environment Variables

```env
# Existing
ANTHROPIC_API_KEY=
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback

# New
PORT=3001
DAILY_SCAN_HOUR=6        # Hour to run daily scan (0-23)
DAILY_SCAN_MINUTE=0      # Minute to run daily scan
```

---

## 12. User Flows

### 12.1 First-Time Onboarding
1. Open app → Landing page
2. Read consent block (Plaid + Gmail + AI)
3. Click "Connect My Bank → Get Your Score"
4. Plaid Link opens → connect bank
5. Gmail OAuth popup opens automatically
6. Both scan in parallel, progress shown
7. Health score computed → navigate to Dashboard
8. Dashboard shows: score, stat cards, first insights, budget bars

### 12.2 Daily Return Visit
1. Open app → Dashboard (session persisted)
2. Fresh insights from overnight scan visible
3. "3 new insights since yesterday" in header
4. User dismisses/acts on insight cards

### 12.3 Subscription Management
1. Red badge on Subscriptions sidebar item
2. Click → Subscription Radar page
3. See unused subscriptions with "CANCEL" CTA
4. Click CANCEL → marks as cancelled, removes from monthly total
5. "You'll save $648/year" confirmation

### 12.4 Credit Card Strategy
1. Click Credit Cards in sidebar
2. See all cards with utilization bars
3. AI payoff strategy shown (avalanche vs snowball)
4. "Aria recommends avalanche — saves $340 in interest"
5. Click "Ask Aria" → deep links to coach with card context

### 12.5 Receipt Splitting
1. Dashboard → "Split a Receipt" 
2. 5-step wizard (unchanged)
3. Photo → AI extraction → people → mode → summary
4. Mark Paid tracking

---

## 13. Demo Mode

Demo mode must work 100% offline (no API keys). All screens need hardcoded data:

| Screen | Demo Data |
|--------|-----------|
| Dashboard | 20 sample transactions, health score 74, 2 unused subscriptions |
| Insights | 4 pre-written insight cards |
| AI Coach | 6 rotating Aria responses |
| Subscriptions | Netflix, Spotify, Adobe (Adobe flagged as unused) |
| Budgets | Pre-set budgets, Food shown as over |
| Credit Cards | 2 cards: Visa (45% utilization), Amex (12%), avalanche recommendation |
| Split Receipt | Skip OCR — use sample restaurant receipt data |

---

## 14. Out of Scope (Hackathon)

- Real payment/cancellation of subscriptions (links/instructions only)
- Push notifications or email reminders
- Multi-user / family accounts
- Persistent database (all in-memory + localStorage)
- PDF receipt support (images only)
- Investment portfolio tracking
- Tax preparation features
- International currency support

---

## 15. Success Metrics (Hackathon Demo)

- [ ] Landing → Dashboard flow completes in < 30 seconds
- [ ] Demo mode works with zero API keys
- [ ] All 6 features visible and interactive in dashboard
- [ ] Credit card payoff strategy displayed with AI recommendation
- [ ] Health score shows with breakdown
- [ ] Subscription radar detects and flags unused subscriptions
- [ ] Receipt splitter completes full 5-step flow
- [ ] AI Coach responds in Aria persona (helpful, never rude)
- [ ] No blank screens on browser refresh
- [ ] Smooth scroll + animations throughout

---

*BudgetAI — Built for the hackathon. Designed to win.*
