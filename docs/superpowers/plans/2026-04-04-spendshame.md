# SpendShame Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build SpendShame — a full-stack fintech web app where users connect their bank via Plaid Sandbox and get assigned an AI villain persona that roasts their spending habits using Claude AI.

**Architecture:** Monorepo with `/server` (Express + Plaid + Claude) and `/client` (React + Vite + Tailwind). Server holds Plaid access_token in memory. Client drives a 4-screen flow: Connect → Villain Reveal → Shame Dashboard → Redemption Chat.

**Tech Stack:** React 18, Vite, Tailwind CSS, Framer Motion, Recharts, html2canvas, Node.js, Express, plaid-node, @anthropic-ai/sdk, React Router v6, @plaid/plaid-link

**Base directory:** `C:/Users/vrani/Downloads/fintech hackathon/`

---

## File Map

```
fintech hackathon/
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── index.js                  # Express app, CORS, routes mount
│   ├── store.js                  # In-memory access_token store
│   ├── routes/
│   │   ├── plaid.js              # /api/create_link_token, /exchange_token, /transactions
│   │   └── ai.js                 # /api/analyze, /api/roast, /api/advice
│   └── services/
│       ├── plaidService.js       # Plaid SDK wrapper
│       └── claudeService.js      # Anthropic SDK wrapper + prompts
├── client/
│   ├── package.json
│   ├── vite.config.js            # proxy /api → localhost:3001
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html                # Google Fonts: Syne + DM Sans
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx               # React Router routes
│   │   ├── api/index.js          # fetch wrappers for all endpoints
│   │   ├── data/demoData.js      # 20 hardcoded demo transactions
│   │   ├── context/AppContext.jsx # villain + transactions global state
│   │   ├── components/
│   │   │   ├── HPBar.jsx         # Animated red health bar
│   │   │   ├── SpendChart.jsx    # Recharts BarChart top 5 categories
│   │   │   ├── VillainCardShare.jsx  # html2canvas shareable card
│   │   │   └── TransactionRoastItem.jsx  # single tx row + roast line
│   │   ├── pages/
│   │   │   ├── Landing.jsx       # Screen 1: connect + demo mode
│   │   │   ├── VillainReveal.jsx # Screen 2: animated reveal
│   │   │   ├── Dashboard.jsx     # Screen 3: charts + roast feed + HP
│   │   │   └── RedemptionChat.jsx # Screen 4: villain chat
│   │   └── styles/
│   │       └── globals.css       # CSS vars, font imports, base styles
└── README.md
```

---

## Task 1: Monorepo Scaffolding

**Files:**
- Create: `server/package.json`
- Create: `server/.env.example`
- Create: `client/package.json`
- Create: `client/vite.config.js`
- Create: `client/tailwind.config.js`
- Create: `client/postcss.config.js`
- Create: `client/index.html`
- Create: `README.md`

- [ ] **Step 1: Create server/package.json**

```json
{
  "name": "spendshame-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch index.js",
    "start": "node index.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "plaid": "^26.0.0"
  }
}
```

- [ ] **Step 2: Create server/.env.example**

```
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_sandbox_secret
PLAID_ENV=sandbox
ANTHROPIC_API_KEY=your_anthropic_api_key
PORT=3001
```

- [ ] **Step 3: Create client/package.json**

```json
{
  "name": "spendshame-client",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "@plaid/plaid-link": "^3.7.0",
    "framer-motion": "^11.2.10",
    "html2canvas": "^1.4.1",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.1",
    "recharts": "^2.12.7"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "vite": "^5.3.1"
  }
}
```

- [ ] **Step 4: Create client/vite.config.js**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 5: Create client/tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        red: '#E8341A',
        dark: '#0F0D0C',
        cream: '#F7F2EC',
        muted: '#8A7F76',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        dm: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 6: Create client/postcss.config.js**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 7: Create client/index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SpendShame — Your Money Has a Villain</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create README.md**

```markdown
# SpendShame 💀

> Your money has a villain. His name is you.

## Setup

### 1. Install dependencies
\`\`\`bash
cd server && npm install
cd ../client && npm install
\`\`\`

### 2. Configure environment
\`\`\`bash
cp server/.env.example server/.env
# Fill in: PLAID_CLIENT_ID, PLAID_SECRET, ANTHROPIC_API_KEY
\`\`\`

### 3. Run
\`\`\`bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
\`\`\`

### 4. Plaid Sandbox credentials
- Username: `user_good`
- Password: `pass_good`
- Select: **First Platypus Bank**

## Demo Mode
Click "Demo Mode" on the landing page — no Plaid account needed.
```

- [ ] **Step 9: Install dependencies in both folders**

```bash
cd "C:/Users/vrani/Downloads/fintech hackathon/server" && npm install
cd "C:/Users/vrani/Downloads/fintech hackathon/client" && npm install
```

- [ ] **Step 10: Commit scaffolding**

```bash
cd "C:/Users/vrani/Downloads/fintech hackathon"
git init
git add .
git commit -m "feat: monorepo scaffold — server + client package setup"
```

---

## Task 2: Server Foundation

**Files:**
- Create: `server/store.js`
- Create: `server/index.js`

- [ ] **Step 1: Create server/store.js**

```js
// In-memory store — fine for hackathon, single user
let accessToken = null

export const setAccessToken = (token) => { accessToken = token }
export const getAccessToken = () => accessToken
```

- [ ] **Step 2: Create server/index.js**

```js
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import plaidRoutes from './routes/plaid.js'
import aiRoutes from './routes/ai.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/api', plaidRoutes)
app.use('/api', aiRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => console.log(`SpendShame server running on :${PORT}`))
```

- [ ] **Step 3: Verify server starts (no .env yet, just test it boots)**

```bash
cd "C:/Users/vrani/Downloads/fintech hackathon/server"
node index.js
```

Expected: `SpendShame server running on :3001` (will crash if .env missing — that's fine, verify the import chain works)

- [ ] **Step 4: Commit**

```bash
git add server/store.js server/index.js
git commit -m "feat: express server foundation with CORS and route mounting"
```

---

## Task 3: Plaid Service + Routes

**Files:**
- Create: `server/services/plaidService.js`
- Create: `server/routes/plaid.js`

- [ ] **Step 1: Create server/services/plaidService.js**

```js
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid'

const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
})

export const plaidClient = new PlaidApi(config)

export async function createLinkToken() {
  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: 'spendshame-user-1' },
    client_name: 'SpendShame',
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: 'en',
  })
  return response.data.link_token
}

export async function exchangePublicToken(publicToken) {
  const response = await plaidClient.itemPublicTokenExchange({ public_token: publicToken })
  return response.data.access_token
}

export async function getTransactions(accessToken) {
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - 90)

  const response = await plaidClient.transactionsGet({
    access_token: accessToken,
    start_date: start.toISOString().split('T')[0],
    end_date: now.toISOString().split('T')[0],
    options: { count: 100 },
  })

  return response.data.transactions.map((tx) => ({
    merchant_name: tx.merchant_name || tx.name,
    amount: tx.amount,
    date: tx.date,
    category: tx.personal_finance_category?.primary || (tx.category?.[0] ?? 'Other'),
  }))
}
```

- [ ] **Step 2: Create server/routes/plaid.js**

```js
import { Router } from 'express'
import { createLinkToken, exchangePublicToken, getTransactions } from '../services/plaidService.js'
import { setAccessToken, getAccessToken } from '../store.js'

const router = Router()

router.post('/create_link_token', async (req, res) => {
  try {
    const linkToken = await createLinkToken()
    res.json({ link_token: linkToken })
  } catch (err) {
    console.error('create_link_token error:', err.response?.data || err.message)
    res.status(500).json({ error: 'Failed to create link token' })
  }
})

router.post('/exchange_token', async (req, res) => {
  try {
    const { public_token } = req.body
    const accessToken = await exchangePublicToken(public_token)
    setAccessToken(accessToken)
    res.json({ success: true })
  } catch (err) {
    console.error('exchange_token error:', err.response?.data || err.message)
    res.status(500).json({ error: 'Failed to exchange token' })
  }
})

router.post('/transactions', async (req, res) => {
  try {
    const accessToken = getAccessToken()
    if (!accessToken) return res.status(400).json({ error: 'No access token. Connect bank first.' })
    const transactions = await getTransactions(accessToken)
    res.json({ transactions })
  } catch (err) {
    console.error('transactions error:', err.response?.data || err.message)
    res.status(500).json({ error: 'Failed to fetch transactions' })
  }
})

export default router
```

- [ ] **Step 3: Commit**

```bash
git add server/services/plaidService.js server/routes/plaid.js
git commit -m "feat: plaid service + routes (link token, exchange, transactions)"
```

---

## Task 4: Claude AI Service + Routes

**Files:**
- Create: `server/services/claudeService.js`
- Create: `server/routes/ai.js`

- [ ] **Step 1: Create server/services/claudeService.js**

```js
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-20250514'

export async function analyzeTransactions(transactions) {
  const txJson = JSON.stringify(transactions.slice(0, 60))

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system:
      "You are SpendShame's villain assignment engine. Analyze the user's real bank transactions and return ONLY valid JSON with no markdown, no code fences, no explanation.",
    messages: [
      {
        role: 'user',
        content: `Here are the user's last 90 days of transactions: ${txJson}

Based on dominant spending patterns, assign one villain archetype from these 4:
- "impulse_king": high variance purchases, late-night shopping, many small merchants
- "subscription_hoarder": many recurring charges, streaming services, SaaS tools  
- "yolo_investor": large irregular transfers, investment apps, crypto exchanges
- "latte_phantom": high food/coffee frequency, delivery apps, cafe merchants

Return EXACTLY this JSON structure (no markdown):
{
  "villain_type": "impulse_king|subscription_hoarder|yolo_investor|latte_phantom",
  "villain_name": "a darkly funny villain name",
  "villain_emoji": "one emoji",
  "villain_description": "2 sentences, darkly funny, referencing their actual habits",
  "signature_taunts": ["taunt 1 referencing actual merchant names and amounts", "taunt 2", "taunt 3"],
  "worst_stat": "one shocking sentence about their worst habit using real numbers from the data",
  "hp": 100
}`,
      },
    ],
  })

  const raw = message.content[0].text.trim()
  return JSON.parse(raw)
}

export async function roastTransaction(transaction, villainType) {
  const villainVoices = {
    impulse_king: 'arrogant royalty who mocks impulsive spending',
    subscription_hoarder: 'obsessive collector who hoards digital subscriptions',
    yolo_investor: 'reckless gambler who laughs at financial risk',
    latte_phantom: 'ghostly coffee addict haunting every cafe',
  }
  const voice = villainVoices[villainType] || 'financial villain'

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 150,
    system: `You are a ${voice}. Give one short, savage roast (1-2 sentences max) about this transaction. Be darkly funny, specific to the merchant. No emojis at start. No markdown.`,
    messages: [
      {
        role: 'user',
        content: `Transaction: $${transaction.amount} at ${transaction.merchant_name} on ${transaction.date}`,
      },
    ],
  })

  return message.content[0].text.trim()
}

export async function getVillainAdvice(userMessage, txSummary, villainType) {
  const villainVoices = {
    impulse_king: 'The Impulse King — an arrogant financial overlord who reluctantly gives real advice wrapped in mockery',
    subscription_hoarder: 'The Subscription Hoarder — a passive-aggressive digital hoarder who gives advice through disappointment',
    yolo_investor: 'The YOLO Investor — a chaotic gambler who gives surprisingly real advice between reckless suggestions',
    latte_phantom: 'The Latte Phantom — a ghostly caffeine spirit who haunts bad financial decisions with passive-aggressive wisdom',
  }
  const voice = villainVoices[villainType] || 'a sarcastic financial villain'

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: `You are ${voice}. Give financial advice that is darkly funny but actually useful. Reference real numbers from the transaction summary. Keep responses under 4 sentences. No markdown.`,
    messages: [
      {
        role: 'user',
        content: `Transaction summary: ${txSummary}\n\nUser asks: ${userMessage}`,
      },
    ],
  })

  return message.content[0].text.trim()
}
```

- [ ] **Step 2: Create server/routes/ai.js**

```js
import { Router } from 'express'
import { analyzeTransactions, roastTransaction, getVillainAdvice } from '../services/claudeService.js'

const router = Router()

router.post('/analyze', async (req, res) => {
  try {
    const { transactions } = req.body
    if (!transactions?.length) return res.status(400).json({ error: 'No transactions provided' })
    const villain = await analyzeTransactions(transactions)
    res.json(villain)
  } catch (err) {
    console.error('analyze error:', err.message)
    res.status(500).json({ error: 'Failed to analyze transactions' })
  }
})

router.post('/roast', async (req, res) => {
  try {
    const { transaction, villain_type } = req.body
    const taunt = await roastTransaction(transaction, villain_type)
    res.json({ taunt })
  } catch (err) {
    console.error('roast error:', err.message)
    res.status(500).json({ error: 'Failed to roast transaction' })
  }
})

router.post('/advice', async (req, res) => {
  try {
    const { message, tx_summary, villain_type } = req.body
    const advice = await getVillainAdvice(message, tx_summary, villain_type)
    res.json({ advice })
  } catch (err) {
    console.error('advice error:', err.message)
    res.status(500).json({ error: 'Failed to get advice' })
  }
})

export default router
```

- [ ] **Step 3: Commit**

```bash
git add server/services/claudeService.js server/routes/ai.js
git commit -m "feat: claude AI service + analyze/roast/advice routes"
```

---

## Task 5: Client Foundation

**Files:**
- Create: `client/src/styles/globals.css`
- Create: `client/src/main.jsx`
- Create: `client/src/api/index.js`
- Create: `client/src/data/demoData.js`
- Create: `client/src/context/AppContext.jsx`
- Create: `client/src/App.jsx`

- [ ] **Step 1: Create client/src/styles/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --red: #E8341A;
  --dark: #0F0D0C;
  --cream: #F7F2EC;
  --muted: #8A7F76;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background-color: var(--dark);
  color: var(--cream);
  font-family: 'DM Sans', sans-serif;
  font-weight: 400;
  min-height: 100vh;
}

h1, h2, h3, h4 {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
}

.btn-primary {
  background-color: var(--red);
  color: white;
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 14px 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.btn-primary:hover {
  opacity: 0.88;
}

.btn-primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.card {
  background: white;
  border: 0.5px solid rgba(15, 13, 12, 0.1);
  border-radius: 12px;
  padding: 24px;
  color: var(--dark);
}

.villain-bubble {
  background: var(--dark);
  color: var(--cream);
  border-radius: 12px;
  padding: 12px 16px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem;
}
```

- [ ] **Step 2: Create client/src/main.jsx**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 3: Create client/src/api/index.js**

```js
const BASE = '/api'

export async function createLinkToken() {
  const res = await fetch(`${BASE}/create_link_token`, { method: 'POST' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to create link token')
  return data.link_token
}

export async function exchangeToken(publicToken) {
  const res = await fetch(`${BASE}/exchange_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ public_token: publicToken }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to exchange token')
  return data
}

export async function fetchTransactions() {
  const res = await fetch(`${BASE}/transactions`, { method: 'POST' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to fetch transactions')
  return data.transactions
}

export async function analyzeTransactions(transactions) {
  const res = await fetch(`${BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactions }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to analyze')
  return data
}

export async function roastTransaction(transaction, villain_type) {
  const res = await fetch(`${BASE}/roast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transaction, villain_type }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to roast')
  return data.taunt
}

export async function getAdvice(message, tx_summary, villain_type) {
  const res = await fetch(`${BASE}/advice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, tx_summary, villain_type }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to get advice')
  return data.advice
}
```

- [ ] **Step 4: Create client/src/data/demoData.js**

```js
export const demoTransactions = [
  { merchant_name: 'Starbucks', amount: 7.45, date: '2026-04-01', category: 'Food and Drink' },
  { merchant_name: 'Starbucks', amount: 6.95, date: '2026-03-30', category: 'Food and Drink' },
  { merchant_name: 'Starbucks', amount: 8.20, date: '2026-03-29', category: 'Food and Drink' },
  { merchant_name: 'Uber Eats', amount: 34.50, date: '2026-04-01', category: 'Food and Drink' },
  { merchant_name: 'Uber Eats', amount: 41.20, date: '2026-03-28', category: 'Food and Drink' },
  { merchant_name: 'DoorDash', amount: 28.75, date: '2026-03-25', category: 'Food and Drink' },
  { merchant_name: 'Netflix', amount: 15.49, date: '2026-03-20', category: 'Entertainment' },
  { merchant_name: 'Spotify', amount: 9.99, date: '2026-03-20', category: 'Entertainment' },
  { merchant_name: 'Hulu', amount: 17.99, date: '2026-03-18', category: 'Entertainment' },
  { merchant_name: 'Amazon Prime', amount: 14.99, date: '2026-03-15', category: 'Shopping' },
  { merchant_name: 'Amazon', amount: 67.34, date: '2026-04-02', category: 'Shopping' },
  { merchant_name: 'Amazon', amount: 23.99, date: '2026-03-27', category: 'Shopping' },
  { merchant_name: 'Target', amount: 112.40, date: '2026-03-22', category: 'Shopping' },
  { merchant_name: 'Walgreens', amount: 18.50, date: '2026-03-21', category: 'Shopping' },
  { merchant_name: 'Chipotle', amount: 14.25, date: '2026-03-31', category: 'Food and Drink' },
  { merchant_name: 'McDonald\'s', amount: 8.90, date: '2026-03-28', category: 'Food and Drink' },
  { merchant_name: 'Discord Nitro', amount: 9.99, date: '2026-03-01', category: 'Entertainment' },
  { merchant_name: 'Notion', amount: 16.00, date: '2026-03-01', category: 'Software' },
  { merchant_name: 'Grubhub', amount: 52.10, date: '2026-03-15', category: 'Food and Drink' },
  { merchant_name: 'Taco Bell', amount: 11.30, date: '2026-03-26', category: 'Food and Drink' },
]
```

- [ ] **Step 5: Create client/src/context/AppContext.jsx**

```jsx
import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [transactions, setTransactions] = useState([])
  const [villain, setVillain] = useState(null)
  const [hp, setHp] = useState(100)
  const [isDemoMode, setIsDemoMode] = useState(false)

  return (
    <AppContext.Provider value={{
      transactions, setTransactions,
      villain, setVillain,
      hp, setHp,
      isDemoMode, setIsDemoMode,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
```

- [ ] **Step 6: Create client/src/App.jsx**

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext.jsx'
import Landing from './pages/Landing.jsx'
import VillainReveal from './pages/VillainReveal.jsx'
import Dashboard from './pages/Dashboard.jsx'
import RedemptionChat from './pages/RedemptionChat.jsx'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/reveal" element={<VillainReveal />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat" element={<RedemptionChat />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add client/src/
git commit -m "feat: client foundation — context, router, api, demo data, global styles"
```

---

## Task 6: Shared Components

**Files:**
- Create: `client/src/components/HPBar.jsx`
- Create: `client/src/components/SpendChart.jsx`
- Create: `client/src/components/VillainCardShare.jsx`
- Create: `client/src/components/TransactionRoastItem.jsx`

- [ ] **Step 1: Create client/src/components/HPBar.jsx**

```jsx
import { motion } from 'framer-motion'

export default function HPBar({ hp, maxHp = 100 }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  const color = pct > 50 ? '#E8341A' : pct > 25 ? '#ff6b35' : '#ff0000'

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span className="font-dm text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Villain HP
        </span>
        <span className="font-syne font-bold text-sm" style={{ color: '#E8341A' }}>
          {hp}/{maxHp}
        </span>
      </div>
      <div className="w-full h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <motion.div
          className="h-3 rounded-full"
          style={{ background: color }}
          initial={{ width: '100%' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create client/src/components/SpendChart.jsx**

```jsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function SpendChart({ transactions }) {
  const categoryTotals = transactions.reduce((acc, tx) => {
    const cat = tx.category || 'Other'
    acc[cat] = (acc[cat] || 0) + tx.amount
    return acc
  }, {})

  const data = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, total]) => ({ name: name.replace(/_/g, ' '), total: parseFloat(total.toFixed(2)) }))

  return (
    <div className="card w-full">
      <h3 className="font-syne font-bold text-base mb-4" style={{ color: 'var(--dark)' }}>
        Top Spend Categories
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fontFamily: 'DM Sans', fill: '#8A7F76' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fontFamily: 'DM Sans', fill: '#8A7F76' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [`$${value}`, 'Spent']}
            contentStyle={{ fontFamily: 'DM Sans', fontSize: 13, borderRadius: 8, border: '0.5px solid rgba(15,13,12,0.1)' }}
          />
          <Bar dataKey="total" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={index === 0 ? '#E8341A' : '#0F0D0C'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 3: Create client/src/components/VillainCardShare.jsx**

```jsx
import { useRef } from 'react'
import html2canvas from 'html2canvas'

export default function VillainCardShare({ villain, onClose }) {
  const cardRef = useRef(null)

  const download = async () => {
    if (!cardRef.current) return
    const canvas = await html2canvas(cardRef.current, { backgroundColor: '#0F0D0C', scale: 2 })
    const link = document.createElement('a')
    link.download = `spendshame-${villain.villain_name.replace(/\s+/g, '-').toLowerCase()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(15,13,12,0.85)' }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-center gap-4">
        <div
          ref={cardRef}
          style={{
            background: 'var(--dark)',
            border: '1px solid rgba(232,52,26,0.4)',
            borderRadius: 16,
            padding: '32px 40px',
            width: 340,
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 64, marginBottom: 8 }}>{villain.villain_emoji}</p>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: 'var(--cream)', marginBottom: 8 }}>
            {villain.villain_name}
          </h2>
          <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
            {villain.worst_stat}
          </p>
          <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 11, color: '#E8341A', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            SpendShame
          </p>
        </div>

        <div className="flex gap-3">
          <button className="btn-primary" onClick={download}>
            Download PNG
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(247,242,236,0.3)',
              color: 'var(--cream)',
              padding: '14px 24px',
              borderRadius: 8,
              fontFamily: 'Syne',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontSize: 14,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create client/src/components/TransactionRoastItem.jsx**

```jsx
export default function TransactionRoastItem({ transaction, taunt }) {
  return (
    <div className="flex flex-col gap-1 py-3" style={{ borderBottom: '0.5px solid rgba(247,242,236,0.08)' }}>
      <div className="flex justify-between items-center">
        <span className="font-dm font-medium text-sm" style={{ color: 'var(--cream)' }}>
          {transaction.merchant_name}
        </span>
        <span className="font-syne font-bold text-sm" style={{ color: '#E8341A' }}>
          ${transaction.amount.toFixed(2)}
        </span>
      </div>
      <p className="font-dm text-xs" style={{ color: 'var(--muted)' }}>
        {transaction.date}
      </p>
      {taunt && (
        <p className="font-dm text-sm italic mt-1" style={{ color: 'rgba(247,242,236,0.6)' }}>
          💀 "{taunt}"
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add client/src/components/
git commit -m "feat: shared components — HPBar, SpendChart, VillainCardShare, TransactionRoastItem"
```

---

## Task 7: Screen 1 — Landing Page

**Files:**
- Create: `client/src/pages/Landing.jsx`

- [ ] **Step 1: Create client/src/pages/Landing.jsx**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlaidLink } from '@plaid/plaid-link'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import { createLinkToken, exchangeToken, fetchTransactions, analyzeTransactions } from '../api/index.js'
import { demoTransactions } from '../data/demoData.js'

export default function Landing() {
  const navigate = useNavigate()
  const { setTransactions, setVillain, setIsDemoMode } = useApp()
  const [linkToken, setLinkToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const runFullFlow = async (transactions, isDemo = false) => {
    setStatus('Analyzing your spending sins...')
    const villain = await analyzeTransactions(transactions)
    setTransactions(transactions)
    setVillain(villain)
    setIsDemoMode(isDemo)
    navigate('/reveal')
  }

  const handleConnectBank = async () => {
    setLoading(true)
    setError('')
    try {
      setStatus('Creating secure link...')
      const token = await createLinkToken()
      setLinkToken(token)
    } catch (e) {
      setError(e.message)
      setLoading(false)
      setStatus('')
    }
  }

  const handleDemoMode = async () => {
    setLoading(true)
    setError('')
    try {
      await runFullFlow(demoTransactions, true)
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken) => {
      try {
        setStatus('Connecting to bank...')
        await exchangeToken(publicToken)
        setStatus('Fetching your shameful transactions...')
        const transactions = await fetchTransactions()
        await runFullFlow(transactions, false)
      } catch (e) {
        setError(e.message)
        setLoading(false)
        setStatus('')
      }
    },
    onExit: () => {
      setLoading(false)
      setStatus('')
      setLinkToken(null)
    },
  })

  // Auto-open Plaid Link when token is ready
  if (linkToken && ready) {
    open()
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--dark)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center gap-6 max-w-lg"
      >
        <p style={{ fontSize: 72, lineHeight: 1 }}>💀</p>

        <div>
          <h1
            className="font-syne"
            style={{ fontSize: 'clamp(48px, 10vw, 80px)', fontWeight: 800, color: 'var(--cream)', lineHeight: 1 }}
          >
            SpendShame
          </h1>
          <p
            className="font-dm mt-3"
            style={{ fontSize: 18, color: 'var(--muted)', fontWeight: 300 }}
          >
            Your money has a villain.{' '}
            <span style={{ color: '#E8341A', fontWeight: 500 }}>His name is you.</span>
          </p>
        </div>

        {error && (
          <p className="font-dm text-sm" style={{ color: '#E8341A' }}>
            {error}
          </p>
        )}

        {status && !error && (
          <p className="font-dm text-sm" style={{ color: 'var(--muted)' }}>
            {status}
          </p>
        )}

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            className="btn-primary"
            onClick={handleConnectBank}
            disabled={loading}
            style={{ fontSize: 15 }}
          >
            {loading && !status.includes('Demo') ? 'Connecting...' : 'Connect My Bank'}
          </button>

          <button
            onClick={handleDemoMode}
            disabled={loading}
            style={{
              background: 'transparent',
              border: '1px solid rgba(247,242,236,0.2)',
              color: 'var(--muted)',
              fontFamily: 'DM Sans',
              fontSize: 14,
              padding: '12px 24px',
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
          >
            Try Demo Mode
          </button>
        </div>

        <p className="font-dm text-xs" style={{ color: 'var(--muted)', opacity: 0.5 }}>
          Plaid Sandbox • No real data stored
        </p>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/Landing.jsx
git commit -m "feat: landing page with Plaid Link + demo mode"
```

---

## Task 8: Screen 2 — Villain Reveal

**Files:**
- Create: `client/src/pages/VillainReveal.jsx`

- [ ] **Step 1: Create client/src/pages/VillainReveal.jsx**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import HPBar from '../components/HPBar.jsx'
import VillainCardShare from '../components/VillainCardShare.jsx'

export default function VillainReveal() {
  const navigate = useNavigate()
  const { villain, hp } = useApp()
  const [showShare, setShowShare] = useState(false)

  if (!villain) {
    navigate('/')
    return null
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'var(--dark)' }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg flex flex-col items-center gap-8"
      >
        {/* Villain emoji dramatic entrance */}
        <motion.p
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          style={{ fontSize: 96 }}
        >
          {villain.villain_emoji}
        </motion.p>

        {/* Villain card slides up */}
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="card w-full"
        >
          <div className="flex flex-col gap-4">
            <div>
              <p className="font-dm text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
                Your Villain
              </p>
              <h2 className="font-syne text-3xl" style={{ color: 'var(--dark)' }}>
                {villain.villain_name}
              </h2>
            </div>

            <p className="font-dm text-sm leading-relaxed" style={{ color: '#3a3632' }}>
              {villain.villain_description}
            </p>

            <HPBar hp={hp} />

            <div className="flex flex-col gap-2 mt-2">
              <p className="font-dm text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                Signature Taunts
              </p>
              {villain.signature_taunts.map((taunt, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 + i * 0.15 }}
                  className="villain-bubble"
                  style={{ background: 'var(--dark)', color: 'var(--cream)' }}
                >
                  <span style={{ marginRight: 8 }}>💀</span>
                  {taunt}
                </motion.div>
              ))}
            </div>

            <div
              className="mt-2 p-3 rounded-lg"
              style={{ background: 'rgba(232,52,26,0.06)', border: '0.5px solid rgba(232,52,26,0.2)' }}
            >
              <p className="font-dm text-sm font-medium" style={{ color: '#E8341A' }}>
                ⚠️ {villain.worst_stat}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex flex-col gap-3 w-full"
        >
          <button className="btn-primary" onClick={() => navigate('/dashboard')}>
            Enter the Shame Dashboard →
          </button>
          <button
            onClick={() => setShowShare(true)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(247,242,236,0.2)',
              color: 'var(--cream)',
              fontFamily: 'Syne',
              fontWeight: 700,
              fontSize: 13,
              padding: '12px 24px',
              borderRadius: 8,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Share My Villain Card
          </button>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showShare && <VillainCardShare villain={villain} onClose={() => setShowShare(false)} />}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/VillainReveal.jsx
git commit -m "feat: villain reveal screen with Framer Motion animations"
```

---

## Task 9: Screen 3 — Shame Dashboard

**Files:**
- Create: `client/src/pages/Dashboard.jsx`

- [ ] **Step 1: Create client/src/pages/Dashboard.jsx**

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import HPBar from '../components/HPBar.jsx'
import SpendChart from '../components/SpendChart.jsx'
import TransactionRoastItem from '../components/TransactionRoastItem.jsx'
import VillainCardShare from '../components/VillainCardShare.jsx'
import { roastTransaction } from '../api/index.js'

export default function Dashboard() {
  const navigate = useNavigate()
  const { villain, transactions, hp, setHp } = useApp()
  const [roasts, setRoasts] = useState({})
  const [loadingRoasts, setLoadingRoasts] = useState(false)
  const [savingsGoal, setSavingsGoal] = useState('')
  const [dealDamageAnim, setDealDamageAnim] = useState(false)
  const [defeated, setDefeated] = useState(false)
  const [showShare, setShowShare] = useState(false)

  useEffect(() => {
    if (!villain || !transactions.length) return
    loadRoasts()
  }, [villain, transactions])

  const loadRoasts = async () => {
    setLoadingRoasts(true)
    const top20 = transactions.slice(0, 20)
    const results = {}
    // Batch: 5 at a time to avoid rate limiting
    for (let i = 0; i < top20.length; i += 5) {
      const batch = top20.slice(i, i + 5)
      await Promise.all(
        batch.map(async (tx, idx) => {
          try {
            const taunt = await roastTransaction(tx, villain.villain_type)
            results[i + idx] = taunt
          } catch {
            results[i + idx] = 'Even I refuse to comment on this one.'
          }
        })
      )
      setRoasts((prev) => ({ ...prev, ...results }))
    }
    setLoadingRoasts(false)
  }

  const dealDamage = () => {
    const goal = parseFloat(savingsGoal)
    if (!goal || goal <= 0) return
    const damage = Math.min(hp, Math.round((goal / 500) * 25))
    setDealDamageAnim(true)
    setTimeout(() => {
      setHp((prev) => {
        const newHp = Math.max(0, prev - damage)
        if (newHp === 0) setDefeated(true)
        return newHp
      })
      setDealDamageAnim(false)
    }, 400)
    setSavingsGoal('')
  }

  if (!villain) {
    navigate('/')
    return null
  }

  const top20 = transactions.slice(0, 20)

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: 'var(--dark)' }}>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="font-syne text-2xl" style={{ color: 'var(--cream)' }}>
            Shame Dashboard
          </h1>
          <button
            onClick={() => setShowShare(true)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(247,242,236,0.15)',
              color: 'var(--muted)',
              fontFamily: 'DM Sans',
              fontSize: 12,
              padding: '8px 14px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Share Card
          </button>
        </div>

        {/* Villain HP card */}
        <div className="card">
          <div className="flex items-center gap-4 mb-4">
            <span style={{ fontSize: 40 }}>{villain.villain_emoji}</span>
            <div>
              <p className="font-dm text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                Current Villain
              </p>
              <p className="font-syne font-bold text-lg" style={{ color: 'var(--dark)' }}>
                {villain.villain_name}
              </p>
            </div>
          </div>
          <HPBar hp={hp} />
          <p className="font-dm text-xs mt-2" style={{ color: 'var(--muted)' }}>
            {villain.worst_stat}
          </p>
        </div>

        {/* Defeat animation */}
        <AnimatePresence>
          {defeated && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="card text-center"
              style={{ borderColor: '#E8341A' }}
            >
              <p style={{ fontSize: 48 }}>🏆</p>
              <h2 className="font-syne text-xl mt-2" style={{ color: 'var(--dark)' }}>
                You defeated {villain.villain_name}!
              </h2>
              <p className="font-dm text-sm mt-1" style={{ color: 'var(--muted)' }}>
                Financial discipline: 1. Villain: 0.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Savings goal / Deal Damage */}
        {!defeated && (
          <div className="card">
            <h3 className="font-syne font-bold text-base mb-3" style={{ color: 'var(--dark)' }}>
              Deal Damage
            </h3>
            <p className="font-dm text-sm mb-3" style={{ color: 'var(--muted)' }}>
              Set a monthly savings goal to damage your villain.
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="e.g. 200"
                value={savingsGoal}
                onChange={(e) => setSavingsGoal(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '0.5px solid rgba(15,13,12,0.2)',
                  fontFamily: 'DM Sans',
                  fontSize: 14,
                  color: 'var(--dark)',
                  outline: 'none',
                }}
              />
              <motion.button
                className="btn-primary"
                onClick={dealDamage}
                animate={dealDamageAnim ? { scale: [1, 0.9, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
                style={{ fontSize: 13 }}
              >
                Deal Damage ⚔️
              </motion.button>
            </div>
          </div>
        )}

        {/* Spend Chart */}
        {transactions.length > 0 && <SpendChart transactions={transactions} />}

        {/* Transaction Roast Feed */}
        <div className="flex flex-col gap-0">
          <h3
            className="font-syne font-bold text-base mb-3"
            style={{ color: 'var(--cream)' }}
          >
            Transaction Roast Feed {loadingRoasts && '(loading taunts...)'}
          </h3>
          {top20.map((tx, i) => (
            <TransactionRoastItem key={i} transaction={tx} taunt={roasts[i]} />
          ))}
        </div>

        {/* Ask for Help */}
        <button
          className="btn-primary"
          onClick={() => navigate('/chat')}
          style={{ marginBottom: 32 }}
        >
          Ask for Help (If You Dare)
        </button>
      </div>

      <AnimatePresence>
        {showShare && <VillainCardShare villain={villain} onClose={() => setShowShare(false)} />}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/Dashboard.jsx
git commit -m "feat: shame dashboard with HP bar, chart, roast feed, deal damage"
```

---

## Task 10: Screen 4 — Redemption Chat

**Files:**
- Create: `client/src/pages/RedemptionChat.jsx`

- [ ] **Step 1: Create client/src/pages/RedemptionChat.jsx**

```jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import { getAdvice } from '../api/index.js'

export default function RedemptionChat() {
  const navigate = useNavigate()
  const { villain, transactions } = useApp()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  const txSummary = transactions.length
    ? `Total spent: $${transactions.reduce((s, t) => s + t.amount, 0).toFixed(2)} across ${transactions.length} transactions. Top merchant: ${
        Object.entries(
          transactions.reduce((acc, t) => { acc[t.merchant_name] = (acc[t.merchant_name] || 0) + 1; return acc }, {})
        ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown'
      }.`
    : 'No transaction data available.'

  useEffect(() => {
    if (!villain) return
    setMessages([
      {
        role: 'villain',
        text: `${villain.villain_emoji} Oh look, you actually want help. Interesting. ${villain.worst_stat} But fine. What do you want to know?`,
      },
    ])
  }, [villain])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)
    try {
      const advice = await getAdvice(userMsg, txSummary, villain?.villain_type)
      setMessages((prev) => [...prev, { role: 'villain', text: advice }])
    } catch {
      setMessages((prev) => [...prev, { role: 'villain', text: 'Even I am speechless. Try again.' }])
    }
    setLoading(false)
  }

  if (!villain) {
    navigate('/')
    return null
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--dark)', maxHeight: '100vh' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-4"
        style={{ borderBottom: '0.5px solid rgba(247,242,236,0.08)' }}
      >
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--muted)',
            fontFamily: 'DM Sans',
            fontSize: 14,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          ← Back
        </button>
        <span style={{ fontSize: 24 }}>{villain.villain_emoji}</span>
        <div>
          <p className="font-syne font-bold text-sm" style={{ color: 'var(--cream)' }}>
            {villain.villain_name}
          </p>
          <p className="font-dm text-xs" style={{ color: 'var(--muted)' }}>
            Redemption Mode
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3" style={{ paddingBottom: 100 }}>
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
          >
            {msg.role === 'villain' && (
              <span style={{ fontSize: 20, alignSelf: 'flex-end' }}>{villain.villain_emoji}</span>
            )}
            <div
              style={{
                maxWidth: '75%',
                padding: '12px 16px',
                borderRadius: 12,
                fontFamily: 'DM Sans',
                fontSize: 14,
                lineHeight: 1.5,
                ...(msg.role === 'villain'
                  ? { background: '#1a1816', color: 'var(--cream)', borderBottomLeftRadius: 4 }
                  : { background: '#E8341A', color: 'white', borderBottomRightRadius: 4 }),
              }}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}
        {loading && (
          <div className="flex gap-2 items-center">
            <span style={{ fontSize: 20 }}>{villain.villain_emoji}</span>
            <div style={{ padding: '12px 16px', background: '#1a1816', borderRadius: 12, borderBottomLeftRadius: 4 }}>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)', display: 'block' }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 py-4"
        style={{ background: 'var(--dark)', borderTop: '0.5px solid rgba(247,242,236,0.08)' }}
      >
        <div className="flex gap-2 max-w-2xl mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask for financial guidance..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 10,
              border: '0.5px solid rgba(247,242,236,0.15)',
              background: '#1a1816',
              color: 'var(--cream)',
              fontFamily: 'DM Sans',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <button
            className="btn-primary"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{ fontSize: 14, padding: '12px 20px' }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/pages/RedemptionChat.jsx
git commit -m "feat: redemption chat screen with villain voice responses"
```

---

## Task 11: End-to-End Test & Polish

**Files:** No new files — verification only.

- [ ] **Step 1: Copy .env and fill in real keys**

```bash
cp "C:/Users/vrani/Downloads/fintech hackathon/server/.env.example" \
   "C:/Users/vrani/Downloads/fintech hackathon/server/.env"
# Edit server/.env with real PLAID_CLIENT_ID, PLAID_SECRET, ANTHROPIC_API_KEY
```

- [ ] **Step 2: Start server**

```bash
cd "C:/Users/vrani/Downloads/fintech hackathon/server" && npm run dev
```

Expected: `SpendShame server running on :3001`

- [ ] **Step 3: Start client**

```bash
cd "C:/Users/vrani/Downloads/fintech hackathon/client" && npm run dev
```

Expected: `Local: http://localhost:5173/`

- [ ] **Step 4: Test Demo Mode flow**

1. Open `http://localhost:5173`
2. Click "Try Demo Mode"
3. Verify villain reveal page loads with animated emoji + taunts
4. Click "Enter Shame Dashboard" → verify chart + roast feed loads
5. Enter savings goal → click "Deal Damage" → verify HP drops
6. Click "Ask for Help" → type a question → verify villain responds

- [ ] **Step 5: Test Plaid Sandbox flow**

1. Click "Connect My Bank" on landing
2. Plaid Link popup opens → use `user_good` / `pass_good` / select "First Platypus Bank"
3. Verify same flow as demo mode but with real Sandbox data

- [ ] **Step 6: Final commit**

```bash
cd "C:/Users/vrani/Downloads/fintech hackathon"
git add .
git commit -m "feat: spendshame v1 complete — plaid + claude villain flow end-to-end"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] POST /api/create_link_token — Task 3
- [x] POST /api/exchange_token — Task 3
- [x] POST /api/transactions — Task 3
- [x] POST /api/analyze — Task 4
- [x] POST /api/roast — Task 4
- [x] POST /api/advice — Task 4
- [x] 4 villain archetypes in Claude prompt — Task 4
- [x] Screen 1: Landing + Plaid Link + Demo Mode — Task 7
- [x] Screen 2: Villain Reveal + Framer Motion — Task 8
- [x] Screen 3: Dashboard + chart + roast feed + HP + deal damage — Task 9
- [x] Screen 4: Chat — Task 10
- [x] Shareable villain card with html2canvas — Task 6
- [x] Design system: colors, fonts, card style, buttons — Task 5
- [x] README with setup instructions — Task 1
- [x] .env.example — Task 1
- [x] Demo mode with hardcoded transactions — Task 5

**All spec requirements covered.**
