# BudgetAI — Technical Architecture

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, Tailwind CSS, Framer Motion, Recharts |
| Backend | Node.js 20, Express 4, ES Modules |
| AI | Anthropic Claude claude-sonnet-4-20250514 (text + vision) |
| Bank Data | Plaid Node SDK v26, react-plaid-link v4 |
| Email Data | Google APIs (googleapis), Gmail readonly scope |
| Scheduler | node-cron |
| Storage | In-memory (hackathon) + localStorage (client) |

---

## Directory Structure

```
BudgetAI/
├── client/                          # React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx          # Onboarding + consent
│   │   │   ├── Dashboard.jsx        # Main command center
│   │   │   ├── AICoach.jsx          # Aria — AI financial coach
│   │   │   ├── Subscriptions.jsx    # Subscription radar
│   │   │   ├── Budgets.jsx          # Budget vs actual
│   │   │   ├── CreditCards.jsx      # Credit card management
│   │   │   ├── SplitReceipt.jsx     # 5-step receipt splitter
│   │   │   └── VillainReveal.jsx    # Legacy (repurposed as score reveal)
│   │   ├── components/
│   │   │   ├── Sidebar.jsx          # Persistent navigation
│   │   │   ├── InsightCard.jsx      # AI insight cards
│   │   │   ├── HealthScoreBadge.jsx # Animated 0-100 score
│   │   │   ├── BudgetBar.jsx        # Budget progress bars
│   │   │   ├── SkeletonCard.jsx     # Loading skeletons
│   │   │   ├── Toast.jsx            # Notification toasts
│   │   │   ├── SplitSummary.jsx     # Receipt split summary
│   │   │   ├── HPBar.jsx            # Legacy health bar
│   │   │   ├── SpendChart.jsx       # Recharts bar chart
│   │   │   ├── TransactionRoastItem.jsx
│   │   │   └── VillainCardShare.jsx
│   │   ├── context/
│   │   │   └── AppContext.jsx       # Global state
│   │   ├── hooks/
│   │   │   ├── useLocalPersist.js   # localStorage sync
│   │   │   └── useToast.js          # Toast hook
│   │   ├── api/
│   │   │   └── index.js             # All API calls
│   │   ├── data/
│   │   │   └── demoData.js          # Offline demo data
│   │   ├── styles/
│   │   │   └── globals.css          # Design tokens + utilities
│   │   ├── App.jsx                  # Routes + Sidebar layout
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                          # Node/Express backend
│   ├── routes/
│   │   ├── plaid.js                 # Bank connection
│   │   ├── ai.js                    # Claude analyze/roast/advice
│   │   ├── auth.js                  # Google OAuth
│   │   ├── gmail.js                 # Gmail transactions
│   │   ├── split.js                 # Receipt split
│   │   ├── insights.js              # AI insight cards
│   │   ├── subscriptions.js         # Subscription radar
│   │   ├── budgets.js               # Budget management
│   │   └── credit-cards.js          # Credit card analysis
│   ├── services/
│   │   ├── claudeService.js         # Claude API wrapper
│   │   ├── plaidService.js          # Plaid API wrapper
│   │   ├── gmailService.js          # Gmail API + extraction
│   │   ├── splitService.js          # OCR + split logic
│   │   ├── subscriptionService.js   # Recurring charge detection
│   │   ├── healthScoreService.js    # Health score computation
│   │   └── creditCardService.js     # Card analysis + strategy
│   ├── scheduler.js                 # node-cron daily background job
│   ├── store.js                     # In-memory state
│   ├── index.js                     # Express app entry
│   └── package.json
│
├── docs/
│   ├── PRD.md                       # This document's companion
│   ├── ARCHITECTURE.md              # This file
│   └── superpowers/
│       ├── specs/                   # Design specs
│       └── plans/                   # Implementation plans
│
└── README.md
```

---

## Data Flow

### Onboarding Flow
```
User → Landing
  → Plaid Link (popup)
    → POST /api/exchange_token
    → POST /api/transactions  → plaidService → Plaid API
  → Gmail OAuth (popup, auto-triggered)
    → GET /api/auth/google → Google OAuth
    → GET /api/auth/google/callback → setGmailTokens
  → POST /api/gmail/transactions → gmailService → Gmail API → Claude
  → Merge + deduplicate transactions
  → POST /api/analyze → claudeService → Claude (health score + insights)
  → Navigate to /dashboard
```

### Daily Background Scan
```
node-cron @ 6:00 AM
  → gmailService.fetchGmailTransactions(tokens)
  → subscriptionService.detectSubscriptions(transactions + emails)
  → claudeService.generateInsights(data)
  → healthScoreService.computeScore(data)
  → creditCardService.analyzeCards(transactions)
  → store.setInsights / store.setHealthScore / store.setSubscriptions
  → (client reads on next page load via GET /api/insights)
```

### Dashboard Load
```
GET /api/insights       → store.getInsights()
GET /api/health-score   → store.getHealthScore()
GET /api/subscriptions  → store.getSubscriptions()
GET /api/budgets        → store.getBudgets() + compute actual spend
GET /api/credit-cards   → store.getCreditCards()
  → All render in parallel via Promise.all
  → Skeleton loaders show until each resolves
```

---

## Claude Prompts Summary

| Feature | Model | Tokens | Purpose |
|---------|-------|--------|---------|
| Transaction analysis | claude-sonnet-4-20250514 | 1024 | Assign health score on onboarding |
| Gmail extraction | claude-sonnet-4-20250514 | 256 | Extract {merchant, amount, date, category} per email |
| Insight generation | claude-sonnet-4-20250514 | 1024 | Generate 3-5 insight cards from spending data |
| Health score | claude-sonnet-4-20250514 | 512 | 0-100 score with breakdown |
| Subscription detection | claude-sonnet-4-20250514 | 512 | Identify recurring charges, flag unused |
| Budget suggestions | claude-sonnet-4-20250514 | 512 | Suggest budget limits based on history |
| Credit card analysis | claude-sonnet-4-20250514 | 768 | Card utilization + payoff strategy |
| AI Coach (Aria) | claude-sonnet-4-20250514 | 1024 | Multi-turn financial coaching |
| Receipt OCR | claude-sonnet-4-20250514 | 1024 | Vision: extract line items from photo |
| Receipt AI split | claude-sonnet-4-20250514 | 512 | Suggest fair split with reasoning |

---

## State Management

### Server (in-memory)
```js
// store.js
{
  accessToken: string | null,
  gmailTokens: object | null,
  transactions: Transaction[],
  insights: InsightCard[],
  healthScore: { score, grade, breakdown, top_win, top_opportunity, updatedAt },
  subscriptions: Subscription[],
  budgets: { [category]: number },
  creditCards: CreditCard[],
  splits: Map<string, SplitRecord>
}
```

### Client (localStorage via useLocalPersist hook)
```js
// Persisted keys
budgetai_villain     // legacy health reveal data
budgetai_transactions
budgetai_health_score
budgetai_is_demo
budgetai_splits_*    // per split ID
```

---

## Security Notes

- All Google OAuth errors use JSON.stringify (no XSS via template strings)
- Plaid tokens stored in-memory only (never sent to client)
- Gmail tokens stored in-memory only
- `gmail.readonly` scope only — no write access
- CORS locked to `http://localhost:5173`
- JSON body limit: 20MB (for base64 receipt images)
- Input validation on all required fields before Claude calls

---

## Running Locally

```bash
# 1. Clone
git clone https://github.com/ASP25SCM06V/BudgetAI.git
cd BudgetAI

# 2. Server setup
cd server
cp .env.example .env
# Fill in: ANTHROPIC_API_KEY, PLAID_CLIENT_ID, PLAID_SECRET
# Optional: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (for Gmail)
npm install
npm run dev

# 3. Client setup (new terminal)
cd client
npm install
npm run dev

# 4. Open
# http://localhost:5173

# 5. Demo mode (no API keys needed)
# Click "Try with sample data" on the landing page
```
