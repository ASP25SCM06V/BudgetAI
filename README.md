# BudgetAI

> Your personal AI financial coach — smarter than Rocket Money, built for the AI era.

BudgetAI connects your bank accounts and Gmail to give you a complete picture of your financial health. Powered by Claude AI, it detects subscriptions you forgot about, alerts you when budgets trend over, coaches you in natural language, and helps you split bills fairly — all in a premium dark UI that makes managing money feel less like a chore.

---

## Why BudgetAI beats Rocket Money

| Feature | BudgetAI | Rocket Money |
|---|---|---|
| AI financial coach (natural language) | Claude-powered Aria | Basic chatbot |
| Gmail transaction extraction | Automatic, background | Not available |
| Receipt splitting with OCR | Claude Vision, 3 modes | Not available |
| Subscription unused-day tracking | Yes | Partial |
| Credit card payoff strategy | Avalanche + Snowball | Basic |
| Financial Health Score (0-100) | Yes, AI-generated | No |
| Daily background AI analysis | node-cron + Claude | No |
| Free / open source | Yes | $4–12/mo |

---

## Features

### Financial Health Score
A 0-100 score computed by Claude on every sync. Includes grade, breakdown by category, your top win, and your top opportunity. Refreshes daily in the background.

### AI Coach — Aria
Multi-turn financial coaching powered by Claude. Ask anything: "Should I pay off my credit card or invest?" Aria is warm, judgment-free, and context-aware.

### Subscription Radar
Automatically detects recurring charges from bank and Gmail data. Flags subscriptions unused for 30+ days, shows exact last-use date, and calculates annual savings from cancellation.

### Budget vs Actual
Category-level budget tracking with animated progress bars. Shows percentage used, amount remaining, and projects end-of-month spend. Suggests budget limits based on spending history.

### Credit Card Analysis
Tracks utilization per card, total debt, minimum payments, and recommends a payoff strategy (Avalanche vs Snowball) with projected payoff dates and total interest saved.

### Split Receipt
Upload a receipt photo, let Claude OCR extract line items, assign items per person or split equally, track who has paid, and export a summary — all in a 5-step wizard.

### Background Gmail Intelligence
Gmail scan runs silently at 6 AM daily via node-cron. Extracts transactions, subscriptions, and payment confirmations from financial emails. Insights surface naturally in the dashboard — no visible agent panel.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS, Framer Motion, Recharts |
| Backend | Node.js 20, Express 4, ES Modules |
| AI | Anthropic Claude claude-sonnet-4-20250514 (text + vision) |
| Bank Data | Plaid Node SDK v26, react-plaid-link v4 |
| Email Data | Google APIs (googleapis), Gmail readonly scope |
| Scheduler | node-cron |
| Storage | In-memory (hackathon) + localStorage (client) |

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm

### 1. Clone

```bash
git clone https://github.com/ASP25SCM06V/BudgetAI.git
cd BudgetAI
```

### 2. Server setup

```bash
cd server
cp .env.example .env
# Fill in: ANTHROPIC_API_KEY, PLAID_CLIENT_ID, PLAID_SECRET
# Optional: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (for Gmail)
npm install
npm run dev
```

### 3. Client setup (new terminal)

```bash
cd client
npm install
npm run dev
```

### 4. Open

```
http://localhost:5173
```

### 5. Demo mode (no API keys needed)

Click "Try with sample data" on the landing page. All features work with demo data.

---

## Environment Variables

```env
# Required
ANTHROPIC_API_KEY=sk-ant-...
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENV=sandbox

# Optional (Gmail features)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

### Plaid Sandbox Credentials

When Plaid Link opens, use:
- Institution: **First Platypus Bank**
- Username: `user_good`
- Password: `pass_good`

---

## Project Structure

```
BudgetAI/
├── client/                    # React + Vite frontend
│   └── src/
│       ├── pages/             # Landing, Dashboard, AICoach, Subscriptions,
│       │                      # Budgets, CreditCards, SplitReceipt
│       ├── components/        # Sidebar, InsightCard, BudgetBar, HealthScoreBadge...
│       ├── context/           # AppContext (global state)
│       ├── api/               # All API calls
│       └── data/              # demoData.js (offline mode)
├── server/                    # Node/Express backend
│   ├── routes/                # plaid, ai, auth, gmail, split, insights,
│   │                          # subscriptions, budgets, credit-cards
│   ├── services/              # claudeService, plaidService, gmailService,
│   │                          # splitService, subscriptionService,
│   │                          # healthScoreService, creditCardService
│   ├── scheduler.js           # node-cron daily background job
│   ├── store.js               # In-memory state
│   └── index.js               # Express entry
└── docs/
    ├── PRD.md                 # Product Requirements Document
    └── ARCHITECTURE.md        # Technical architecture
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | /api/exchange_token | Connect Plaid bank account |
| POST | /api/transactions | Fetch Plaid transactions |
| POST | /api/analyze | Run full AI analysis |
| GET | /api/insights | Get AI insight cards |
| GET | /api/health-score | Get financial health score |
| GET | /api/subscriptions | Get detected subscriptions |
| GET | /api/budgets | Get budget vs actual |
| POST | /api/budgets | Update budget limits |
| GET | /api/credit-cards | Get credit card analysis |
| POST | /api/credit-cards | Add/update credit card |
| POST | /api/ai/coach | AI Coach (Aria) message |
| GET | /api/auth/google | Start Gmail OAuth |
| GET | /api/auth/google/callback | OAuth callback |
| POST | /api/gmail/transactions | Fetch Gmail transactions |
| POST | /api/split/extract | OCR receipt via Claude Vision |
| POST | /api/split/calculate | Calculate split |
| POST | /api/split/save | Save split record |
| GET | /api/split/:id | Get split status |
| PATCH | /api/split/:id/pay | Mark person as paid |

---

## Docs

- [PRD.md](docs/PRD.md) — Full product requirements
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) — Technical architecture, data flows, Claude prompts

---

## License

MIT
