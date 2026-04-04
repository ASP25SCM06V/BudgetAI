# SpendShame — Gmail Scanner + Receipt Splitter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google Gmail financial scanning (alongside Plaid) and a Smart Receipt Splitter with Claude Vision OCR and per-person paid tracking.

**Architecture:** Two independent feature tracks share a single sequential integration step. Gmail uses Google OAuth 2.0 in a popup window; after Plaid success, the popup opens automatically, tokens stored in-memory, Gmail API queried in parallel across 7 financial email categories, Claude extracts `{merchant_name, amount, date, category}` from each, and results are merged + deduplicated with Plaid. Receipt Splitter is a 5-step wizard: upload image → Claude Vision extracts line items → user adds people → picks split mode (equal/by-item/AI) → mark-paid tracking persisted in server memory + client localStorage.

**Tech Stack:** Node/Express (ES modules), `googleapis` v144, `@anthropic-ai/sdk`, React 18 + Vite, Tailwind CSS, Framer Motion, React Router v6

---

## File Map

**New server files:**
- `server/routes/auth.js` — Google OAuth initiation + callback
- `server/routes/gmail.js` — POST /api/gmail/transactions
- `server/routes/split.js` — extract, calculate, save, pay endpoints
- `server/services/gmailService.js` — Gmail API queries + Claude extraction
- `server/services/splitService.js` — Claude Vision OCR + split logic + in-memory splits Map

**Modified server files:**
- `server/store.js` — add gmailTokens
- `server/index.js` — mount auth, gmail, split routes
- `server/package.json` — add googleapis

**New client files:**
- `client/src/pages/SplitReceipt.jsx` — 5-step receipt split wizard
- `client/src/components/SplitSummary.jsx` — per-person amounts + Mark Paid

**Modified client files:**
- `client/src/pages/Landing.jsx` — inline consent block + Gmail OAuth popup
- `client/src/pages/Dashboard.jsx` — add "Split a Receipt 🧾" button
- `client/src/api/index.js` — gmailTransactions, splitExtract, splitCalculate, splitSave, splitPay
- `client/src/App.jsx` — add /split route

---

## Task 1: Google OAuth Server Routes

**Files:**
- Create: `server/routes/auth.js`

- [ ] **Step 1: Create `server/routes/auth.js`**

```js
import express from 'express'
import { google } from 'googleapis'
import { setGmailTokens } from '../store.js'

const router = express.Router()

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback'
  )
}

// Initiates Google OAuth flow — opened in a popup by the client
router.get('/auth/google', (req, res) => {
  const oauth2Client = getOAuth2Client()
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    prompt: 'consent',
  })
  res.redirect(url)
})

// Google redirects here after user grants/denies access
router.get('/auth/google/callback', async (req, res) => {
  const { code, error } = req.query

  if (error || !code) {
    return res.send(`
      <html><body><script>
        window.opener && window.opener.postMessage(
          { type: 'GMAIL_AUTH_ERROR', error: '${error || 'No code returned'}' },
          'http://localhost:5173'
        );
        window.close();
      </script></body></html>
    `)
  }

  try {
    const oauth2Client = getOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)
    setGmailTokens(tokens)
    res.send(`
      <html><body><script>
        window.opener && window.opener.postMessage(
          { type: 'GMAIL_AUTH_SUCCESS' },
          'http://localhost:5173'
        );
        window.close();
      </script></body></html>
    `)
  } catch (e) {
    res.send(`
      <html><body><script>
        window.opener && window.opener.postMessage(
          { type: 'GMAIL_AUTH_ERROR', error: '${e.message.replace(/'/g, "\\'")}' },
          'http://localhost:5173'
        );
        window.close();
      </script></body></html>
    `)
  }
})

export default router
```

- [ ] **Step 2: Verify file saved correctly**

```bash
node -e "import('./server/routes/auth.js').then(() => console.log('OK')).catch(e => console.error(e.message))"
```

Run from `/server` directory. Expected: `OK` (or a googleapis not-installed error — that's fine, we install in Task 3).

- [ ] **Step 3: Commit**

```bash
cd "server"
git add routes/auth.js
git commit -m "feat: add Google OAuth routes for Gmail access"
```

---

## Task 2: Gmail Service

**Files:**
- Create: `server/services/gmailService.js`

- [ ] **Step 1: Create `server/services/gmailService.js`**

```js
import { google } from 'googleapis'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

// 7 financial email categories searched in parallel
const GMAIL_QUERIES = [
  'subject:(order OR receipt OR confirmation OR purchase) category:primary',
  'subject:(transaction OR charged OR "credit card" OR statement) category:primary',
  'subject:(subscription OR renewal OR billing OR plan) category:primary',
  'subject:(autopay OR "automatic payment" OR "auto-pay") category:primary',
  'subject:(insurance OR premium OR "policy payment") category:primary',
  'subject:(pending OR "payment due" OR invoice) category:primary',
  'subject:(receipt OR paid OR "payment confirmation") category:primary',
]

function buildOAuth2Client(tokens) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback'
  )
  oauth2Client.setCredentials(tokens)
  return oauth2Client
}

async function searchEmails(gmail, query) {
  try {
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 15,
    })
    return res.data.messages || []
  } catch {
    return []
  }
}

function extractTextFromPayload(payload) {
  if (!payload) return ''
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8')
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8')
      }
      const nested = extractTextFromPayload(part)
      if (nested) return nested
    }
  }
  return ''
}

async function getEmailContent(gmail, messageId) {
  const res = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  })
  const headers = res.data.payload?.headers || []
  const subject = headers.find(h => h.name === 'Subject')?.value || ''
  const body = extractTextFromPayload(res.data.payload)
  return { subject, body }
}

async function extractTransaction(subject, body) {
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      system: 'Extract financial transaction data from this email. Return ONLY valid JSON with no markdown: { "merchant_name": string, "amount": number, "date": string, "category": string }. If no clear transaction found, return the exact string null.',
      messages: [{
        role: 'user',
        content: `Subject: ${subject}\n\n${body.substring(0, 1500)}`,
      }],
    })
    const raw = message.content[0].text.trim()
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
    if (raw === 'null' || raw === '') return null
    const parsed = JSON.parse(raw)
    // Validate required fields
    if (!parsed.merchant_name || !parsed.amount) return null
    return parsed
  } catch {
    return null
  }
}

export async function fetchGmailTransactions(tokens) {
  const auth = buildOAuth2Client(tokens)
  const gmail = google.gmail({ version: 'v1', auth })

  // Query all 7 categories in parallel
  const messageArrays = await Promise.all(
    GMAIL_QUERIES.map(q => searchEmails(gmail, q))
  )

  // Deduplicate by message ID
  const seen = new Set()
  const allMessages = []
  for (const msgs of messageArrays) {
    for (const msg of msgs) {
      if (!seen.has(msg.id)) {
        seen.add(msg.id)
        allMessages.push(msg)
      }
    }
  }

  // Cap at 40 emails to keep latency reasonable
  const limited = allMessages.slice(0, 40)

  const results = await Promise.all(
    limited.map(async (msg) => {
      try {
        const { subject, body } = await getEmailContent(gmail, msg.id)
        return await extractTransaction(subject, body)
      } catch {
        return null
      }
    })
  )

  return results.filter(Boolean)
}
```

- [ ] **Step 2: Commit**

```bash
git add services/gmailService.js
git commit -m "feat: add Gmail service with Claude extraction"
```

---

## Task 3: Gmail Transactions Route

**Files:**
- Create: `server/routes/gmail.js`

- [ ] **Step 1: Create `server/routes/gmail.js`**

```js
import express from 'express'
import { getGmailTokens } from '../store.js'
import { fetchGmailTransactions } from '../services/gmailService.js'

const router = express.Router()

router.post('/gmail/transactions', async (req, res, next) => {
  try {
    const tokens = getGmailTokens()
    if (!tokens) {
      return res.status(401).json({ error: 'Gmail not connected' })
    }
    const transactions = await fetchGmailTransactions(tokens)
    res.json({ transactions })
  } catch (e) {
    next(e)
  }
})

export default router
```

- [ ] **Step 2: Commit**

```bash
git add routes/gmail.js
git commit -m "feat: add Gmail transactions route"
```

---

## Task 4: Split Service

**Files:**
- Create: `server/services/splitService.js`

- [ ] **Step 1: Create `server/services/splitService.js`**

```js
import Anthropic from '@anthropic-ai/sdk'
import { randomUUID } from 'crypto'

const client = new Anthropic()

// In-memory store for splits — keyed by UUID
const splits = new Map()

export async function extractReceiptData(base64Image, mediaType = 'image/jpeg') {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64Image,
          },
        },
        {
          type: 'text',
          text: 'You are a receipt parser. Extract all line items and totals from this receipt image. Return ONLY valid JSON with no markdown: { "items": [{"name": string, "price": number}], "subtotal": number, "tax": number, "total": number }. If a field is not visible, use null.',
        },
      ],
    }],
  })

  const raw = message.content[0].text.trim()
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')
  return JSON.parse(raw)
}

export async function calculateSplit(items, people, mode) {
  if (mode === 'equal') {
    const total = items.reduce((sum, i) => sum + (i.price || 0), 0)
    const base = Math.floor((total / people.length) * 100) / 100
    const remainder = Math.round((total - base * (people.length - 1)) * 100) / 100
    return people.map((person, idx) => ({
      person,
      amount: idx === people.length - 1 ? Math.round(remainder * 100) / 100 : base,
      items: [],
      reasoning: '',
    }))
  }

  if (mode === 'by_item') {
    // Each item has an optional `assignedTo` field (person name or null = shared)
    const unassignedItems = items.filter(i => !i.assignedTo)
    const unassignedTotal = unassignedItems.reduce((s, i) => s + (i.price || 0), 0)
    const sharedPerPerson = people.length > 0 ? unassignedTotal / people.length : 0

    return people.map(person => {
      const personItems = items.filter(i => i.assignedTo === person)
      const personOwed = personItems.reduce((s, i) => s + (i.price || 0), 0) + sharedPerPerson
      return {
        person,
        amount: Math.round(personOwed * 100) / 100,
        items: personItems.map(i => i.name),
        reasoning: '',
      }
    })
  }

  if (mode === 'ai') {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Suggest a fair split of this bill among these people based on the items. Items: ${JSON.stringify(items)}. People: ${JSON.stringify(people)}. Return ONLY valid JSON with no markdown: { "splits": [{"person": string, "amount": number, "reasoning": string}] }. Keep reasoning to one short phrase. Amounts must sum to the total.`,
      }],
    })
    const raw = message.content[0].text.trim()
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
    const data = JSON.parse(raw)
    return data.splits
  }

  throw new Error(`Unknown split mode: ${mode}`)
}

export function saveSplit(splitData) {
  const id = randomUUID()
  const record = {
    ...splitData,
    id,
    paid: [],
    createdAt: new Date().toISOString(),
  }
  splits.set(id, record)
  return id
}

export function getSplit(id) {
  return splits.get(id) || null
}

export function markPersonPaid(id, person) {
  const split = splits.get(id)
  if (!split) return null
  if (!split.paid.includes(person)) {
    split.paid.push(person)
  }
  splits.set(id, split)
  return split
}
```

- [ ] **Step 2: Commit**

```bash
git add services/splitService.js
git commit -m "feat: add split service with Claude Vision OCR and split logic"
```

---

## Task 5: Split Routes

**Files:**
- Create: `server/routes/split.js`

- [ ] **Step 1: Create `server/routes/split.js`**

```js
import express from 'express'
import {
  extractReceiptData,
  calculateSplit,
  saveSplit,
  getSplit,
  markPersonPaid,
} from '../services/splitService.js'

const router = express.Router()

// POST /api/split/extract — receives base64 image, returns line items + totals
router.post('/split/extract', async (req, res, next) => {
  try {
    const { base64Image, mediaType } = req.body
    if (!base64Image) {
      return res.status(400).json({ error: 'base64Image is required' })
    }
    const data = await extractReceiptData(base64Image, mediaType || 'image/jpeg')
    res.json(data)
  } catch (e) {
    next(e)
  }
})

// POST /api/split/calculate — receives { items, people, mode }, returns splits array
router.post('/split/calculate', async (req, res, next) => {
  try {
    const { items, people, mode } = req.body
    if (!items || !people || !mode) {
      return res.status(400).json({ error: 'items, people, and mode are required' })
    }
    const result = await calculateSplit(items, people, mode)
    res.json({ splits: result })
  } catch (e) {
    next(e)
  }
})

// POST /api/split/save — saves split state, returns splitId
router.post('/split/save', (req, res, next) => {
  try {
    const id = saveSplit(req.body)
    res.json({ splitId: id })
  } catch (e) {
    next(e)
  }
})

// GET /api/split/:id — fetch split by ID
router.get('/split/:id', (req, res) => {
  const split = getSplit(req.params.id)
  if (!split) return res.status(404).json({ error: 'Split not found' })
  res.json(split)
})

// PATCH /api/split/:id/pay — mark a person as paid
router.patch('/split/:id/pay', (req, res) => {
  const { person } = req.body
  if (!person) return res.status(400).json({ error: 'person is required' })
  const split = markPersonPaid(req.params.id, person)
  if (!split) return res.status(404).json({ error: 'Split not found' })
  res.json(split)
})

export default router
```

- [ ] **Step 2: Commit**

```bash
git add routes/split.js
git commit -m "feat: add receipt split routes"
```

---

## Task 6: Server Infra Wiring (store + index + package.json)

**Files:**
- Modify: `server/store.js`
- Modify: `server/index.js`
- Modify: `server/package.json`

- [ ] **Step 1: Install googleapis**

```bash
cd "server" && npm install googleapis
```

Expected: `added N packages` with no errors.

- [ ] **Step 2: Update `server/store.js`**

Replace the entire file with:

```js
// In-memory store — fine for hackathon, single user
let accessToken = null
let gmailTokens = null

export const setAccessToken = (token) => { accessToken = token }
export const getAccessToken = () => accessToken

export const setGmailTokens = (tokens) => { gmailTokens = tokens }
export const getGmailTokens = () => gmailTokens
```

- [ ] **Step 3: Update `server/index.js`**

Replace the entire file with:

```js
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import plaidRoutes from './routes/plaid.js'
import aiRoutes from './routes/ai.js'
import authRoutes from './routes/auth.js'
import gmailRoutes from './routes/gmail.js'
import splitRoutes from './routes/split.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json({ limit: '20mb' })) // increased for base64 receipt images

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use('/api', plaidRoutes)
app.use('/api', aiRoutes)
app.use('/api', authRoutes)
app.use('/api', gmailRoutes)
app.use('/api', splitRoutes)

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.message)
  res.status(500).json({ error: err.message })
})

app.listen(PORT, () => console.log(`SpendShame server running on :${PORT}`))
```

- [ ] **Step 4: Smoke-test server starts**

```bash
cd "server" && node index.js &
sleep 2
curl http://localhost:3001/api/health
kill %1
```

Expected: `{"status":"ok"}`

- [ ] **Step 5: Commit**

```bash
git add store.js index.js package.json package-lock.json
git commit -m "feat: wire auth/gmail/split routes, add googleapis, increase json limit"
```

---

## Task 7: Landing Page — Inline Consent + Gmail OAuth Popup

**Files:**
- Modify: `client/src/pages/Landing.jsx`

The full updated Landing.jsx. Key changes vs current:
1. Inline consent box between the tagline and the CTA button
2. After Plaid success, `openGmailPopup()` opens `http://localhost:3001/api/auth/google` in a new window
3. `window.addEventListener('message', ...)` resolves/rejects a Promise when popup posts `GMAIL_AUTH_SUCCESS` or `GMAIL_AUTH_ERROR`
4. Gmail transactions fetched from `/api/gmail/transactions`, then merged + deduplicated with Plaid transactions
5. If Gmail fails/denied → proceed with Plaid only, show a status notice

- [ ] **Step 1: Replace `client/src/pages/Landing.jsx`**

```jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlaidLink } from 'react-plaid-link'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import {
  createLinkToken,
  exchangeToken,
  fetchTransactions,
  analyzeTransactions,
  fetchGmailTransactions,
} from '../api/index.js'
import { demoTransactions } from '../data/demoData.js'

const demoVillain = {
  villain_type: 'latte_phantom',
  villain_name: 'The Latte Phantom',
  villain_emoji: '☕',
  villain_description:
    'You haunt every coffee shop within a 2-mile radius, leaving a trail of empty cups and broken savings goals. Starbucks knows your order by heart — and so does your bank statement.',
  signature_taunts: [
    "You spent $22.60 at Starbucks in 3 days. A bag of beans costs $12 and lasts a month. Do the math... actually, please don't.",
    "Uber Eats at 11pm again? Your future self is weeping into a cup of instant ramen.",
    "$52 to Grubhub in one order? A personal chef would've been cheaper. And classier.",
  ],
  worst_stat:
    'You spent $169.05 on food delivery and coffee in 90 days — enough for 14 months of Netflix.',
  hp: 100,
}

// Deduplication: remove Gmail transactions that match a Plaid transaction by merchant+amount+date
function mergeAndDeduplicate(plaid, gmail) {
  const key = (t) => `${(t.merchant_name || '').toLowerCase()}|${t.amount}|${t.date}`
  const plaidKeys = new Set(plaid.map(key))
  const unique = gmail.filter((t) => !plaidKeys.has(key(t)))
  return [...plaid, ...unique]
}

// Opens Google OAuth popup and returns a Promise that resolves when auth completes
function openGmailPopup() {
  return new Promise((resolve, reject) => {
    const popup = window.open(
      'http://localhost:3001/api/auth/google',
      'gmail_oauth',
      'width=500,height=620,top=100,left=100'
    )

    if (!popup) {
      reject(new Error('Popup blocked'))
      return
    }

    const handler = (event) => {
      if (event.origin !== 'http://localhost:3001') return
      window.removeEventListener('message', handler)
      if (event.data?.type === 'GMAIL_AUTH_SUCCESS') {
        resolve()
      } else {
        reject(new Error(event.data?.error || 'Gmail auth failed'))
      }
    }

    window.addEventListener('message', handler)

    // Fallback: if popup is closed without postMessage
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer)
        window.removeEventListener('message', handler)
        reject(new Error('Popup closed'))
      }
    }, 500)
  })
}

export default function Landing() {
  const navigate = useNavigate()
  const { setTransactions, setVillain, setIsDemoMode } = useApp()
  const [linkToken, setLinkToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const runFullFlow = async (transactions, isDemo = false) => {
    setStatus('Analyzing your spending sins...')
    const villain = isDemo ? demoVillain : await analyzeTransactions(transactions)
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
        const plaidTransactions = await fetchTransactions()

        // Attempt Gmail OAuth in popup (auto-triggered, no extra button click)
        let gmailTransactions = []
        try {
          setStatus('Connecting Gmail for deeper analysis...')
          await openGmailPopup()
          setStatus('Scanning financial emails...')
          gmailTransactions = await fetchGmailTransactions()
        } catch {
          // Gmail denied / popup blocked / timed out — proceed with Plaid only
          setStatus('Gmail skipped — using bank data only')
          await new Promise((r) => setTimeout(r, 1200))
        }

        const merged = mergeAndDeduplicate(plaidTransactions, gmailTransactions)
        await runFullFlow(merged, false)
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

  useEffect(() => {
    if (linkToken && ready) {
      open()
    }
  }, [linkToken, ready, open])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--dark)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center gap-6 max-w-lg w-full"
      >
        <motion.p
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          style={{ fontSize: 72, lineHeight: 1 }}
        >
          💀
        </motion.p>

        <div>
          <h1
            style={{
              fontFamily: 'Syne',
              fontSize: 'clamp(48px, 10vw, 80px)',
              fontWeight: 800,
              color: 'var(--cream)',
              lineHeight: 1,
            }}
          >
            SpendShame
          </h1>
          <p
            style={{
              fontFamily: 'DM Sans',
              fontSize: 18,
              color: 'var(--muted)',
              fontWeight: 300,
              marginTop: 12,
            }}
          >
            Your money has a villain.{' '}
            <span style={{ color: '#E8341A', fontWeight: 500 }}>His name is you.</span>
          </p>
        </div>

        {/* Inline consent block */}
        <div
          style={{
            background: '#1a1816',
            border: '1px solid rgba(232,52,26,0.25)',
            borderRadius: 10,
            padding: '14px 16px',
            textAlign: 'left',
            width: '100%',
            maxWidth: 320,
            fontSize: 11,
            color: 'var(--muted)',
            lineHeight: 1.6,
          }}
        >
          <p
            style={{
              color: 'var(--cream)',
              fontWeight: 600,
              marginBottom: 8,
              fontSize: 12,
              fontFamily: 'DM Sans',
            }}
          >
            By continuing you allow SpendShame to:
          </p>
          {[
            'Connect your bank account and read transactions via Plaid',
            'Scan your Gmail for financial emails (receipts, subscriptions, card alerts, insurance, auto-payments)',
            'Analyze your spending with AI to assign your villain',
          ].map((item) => (
            <div
              key={item}
              style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}
            >
              <span style={{ color: '#E8341A', flexShrink: 0 }}>✓</span>
              <span style={{ fontFamily: 'DM Sans' }}>{item}</span>
            </div>
          ))}
          <p
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px solid rgba(247,242,236,0.08)',
              fontSize: 10,
              fontFamily: 'DM Sans',
            }}
          >
            No data stored permanently. Read-only access.
          </p>
        </div>

        {error && (
          <p style={{ color: '#E8341A', fontFamily: 'DM Sans', fontSize: 14 }}>{error}</p>
        )}

        {status && !error && (
          <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans', fontSize: 14 }}>{status}</p>
        )}

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button className="btn-primary" onClick={handleConnectBank} disabled={loading}>
            {loading ? 'Connecting...' : 'I Accept — Connect My Bank'}
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
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.45 : 1,
              transition: 'border-color 0.15s',
            }}
          >
            Try Demo Mode
          </button>
        </div>

        <p
          style={{
            fontFamily: 'DM Sans',
            fontSize: 12,
            color: 'var(--muted)',
            opacity: 0.5,
          }}
        >
          Plaid Sandbox + Gmail read-only • No real data stored
        </p>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd "client"
git add src/pages/Landing.jsx
git commit -m "feat: add inline consent block + Gmail OAuth popup flow to Landing"
```

---

## Task 8: SplitSummary Component

**Files:**
- Create: `client/src/components/SplitSummary.jsx`

- [ ] **Step 1: Create `client/src/components/SplitSummary.jsx`**

```jsx
import { motion } from 'framer-motion'

// Props:
//   splits: [{ person, amount, items, reasoning }]
//   paid: string[]  — names of people who have paid
//   onMarkPaid: (person: string) => void
export default function SplitSummary({ splits, paid, onMarkPaid }) {
  const totalOwed = splits.reduce((sum, s) => sum + s.amount, 0)
  const stillOwed = splits
    .filter((s) => !paid.includes(s.person))
    .reduce((sum, s) => sum + s.amount, 0)

  return (
    <div className="flex flex-col gap-3">
      {splits.map((s, i) => {
        const isPaid = paid.includes(s.person)
        return (
          <motion.div
            key={s.person}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 14px',
              borderRadius: 10,
              background: isPaid ? '#dcfce7' : '#F7F2EC',
              opacity: isPaid ? 0.75 : 1,
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: 'DM Sans',
                  fontWeight: 600,
                  fontSize: 14,
                  color: isPaid ? '#166534' : '#0F0D0C',
                  textDecoration: isPaid ? 'line-through' : 'none',
                }}
              >
                {s.person} {isPaid && '✓'}
              </p>
              {s.items && s.items.length > 0 && (
                <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#8A7F76' }}>
                  {s.items.join(', ')}
                </p>
              )}
              {s.reasoning && (
                <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#8A7F76', fontStyle: 'italic' }}>
                  {s.reasoning}
                </p>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <p
                style={{
                  fontFamily: 'DM Sans',
                  fontWeight: 700,
                  fontSize: 15,
                  color: isPaid ? '#166534' : '#E8341A',
                }}
              >
                ${s.amount.toFixed(2)}
                {isPaid && (
                  <span style={{ fontSize: 11, marginLeft: 4, fontWeight: 400 }}>PAID</span>
                )}
              </p>
              {!isPaid && (
                <button
                  onClick={() => onMarkPaid(s.person)}
                  style={{
                    marginTop: 4,
                    background: '#dcfce7',
                    color: '#166534',
                    border: 'none',
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    cursor: 'pointer',
                    fontFamily: 'DM Sans',
                    fontWeight: 600,
                  }}
                >
                  Mark Paid ✓
                </button>
              )}
            </div>
          </motion.div>
        )
      })}

      {/* Still owed counter */}
      <div
        style={{
          background: stillOwed > 0 ? '#fee2e2' : '#dcfce7',
          borderRadius: 10,
          padding: '10px 14px',
          textAlign: 'center',
        }}
      >
        {stillOwed > 0 ? (
          <p style={{ fontFamily: 'DM Sans', fontWeight: 700, color: '#991b1b', fontSize: 14 }}>
            Still owed: ${stillOwed.toFixed(2)}
          </p>
        ) : (
          <p style={{ fontFamily: 'DM Sans', fontWeight: 700, color: '#166534', fontSize: 14 }}>
            All settled up! 🎉
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SplitSummary.jsx
git commit -m "feat: add SplitSummary component with Mark Paid tracking"
```

---

## Task 9: SplitReceipt Page (5-Step Wizard)

**Files:**
- Create: `client/src/pages/SplitReceipt.jsx`

- [ ] **Step 1: Create `client/src/pages/SplitReceipt.jsx`**

```jsx
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import SplitSummary from '../components/SplitSummary.jsx'
import { splitExtract, splitCalculate, splitSave, splitPay } from '../api/index.js'

const STEPS = ['Upload', 'Review Items', 'Add People', 'Split Mode', 'Summary']

// Convert File to base64 string (without the data:... prefix)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // reader.result is "data:image/jpeg;base64,XXXX" — strip the prefix
      const base64 = reader.result.split(',')[1]
      resolve({ base64, mediaType: file.type })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function SplitReceipt() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [step, setStep] = useState(0) // 0-4
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 0 state
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)

  // Step 1 state — extracted items (editable)
  const [items, setItems] = useState([]) // [{ name, price, assignedTo: null }]
  const [receiptTotal, setReceiptTotal] = useState(null)

  // Step 2 state
  const [people, setPeople] = useState(['You'])
  const [nameInput, setNameInput] = useState('')

  // Step 3 state
  const [splitMode, setSplitMode] = useState('equal') // 'equal' | 'by_item' | 'ai'

  // Step 4 state
  const [splits, setSplits] = useState([]) // [{ person, amount, items, reasoning }]
  const [paid, setPaid] = useState([])
  const [splitId, setSplitId] = useState(null)

  // --- Step 0: File selection ---
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('Image too large — max 10MB')
      return
    }
    setError('')
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleExtract = async () => {
    if (!selectedFile) return
    setLoading(true)
    setError('')
    try {
      const { base64, mediaType } = await fileToBase64(selectedFile)
      const data = await splitExtract(base64, mediaType)
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error("Couldn't read receipt clearly — try a clearer photo")
      }
      setItems(data.items.map((i) => ({ ...i, assignedTo: null })))
      setReceiptTotal(data.total)
      setStep(1)
    } catch (e) {
      setError(e.message || "Couldn't read receipt clearly — try a clearer photo")
    } finally {
      setLoading(false)
    }
  }

  // --- Step 1: Edit items ---
  const updateItem = (idx, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))
  }

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const addItem = () => {
    setItems((prev) => [...prev, { name: '', price: 0, assignedTo: null }])
  }

  // --- Step 2: Add people ---
  const addPerson = () => {
    const name = nameInput.trim()
    if (!name || people.includes(name)) return
    setPeople((prev) => [...prev, name])
    setNameInput('')
  }

  const removePerson = (name) => {
    if (name === 'You') return // can't remove yourself
    setPeople((prev) => prev.filter((p) => p !== name))
    // Unassign items assigned to this person
    setItems((prev) =>
      prev.map((i) => (i.assignedTo === name ? { ...i, assignedTo: null } : i))
    )
  }

  // --- Step 3: Calculate split ---
  const handleCalculate = async () => {
    if (people.length < 1) {
      setError('Add at least one person')
      return
    }
    setLoading(true)
    setError('')
    try {
      const itemsForApi = items.map(({ name, price, assignedTo }) => ({ name, price, assignedTo }))
      const result = await splitCalculate(itemsForApi, people, splitMode)
      setSplits(result)

      // Save to server
      const total = receiptTotal || items.reduce((s, i) => s + i.price, 0)
      const id = await splitSave({ items: itemsForApi, people, mode: splitMode, splits: result, total })
      setSplitId(id)

      // Mirror to localStorage for refresh persistence
      localStorage.setItem(
        `split_${id}`,
        JSON.stringify({ items: itemsForApi, people, mode: splitMode, splits: result, total, paid: [], id })
      )

      setStep(4)
    } catch (e) {
      // Fallback: equal split on error
      const total = receiptTotal || items.reduce((s, i) => s + i.price, 0)
      const base = Math.floor((total / people.length) * 100) / 100
      const fallback = people.map((p, idx) => ({
        person: p,
        amount: idx === people.length - 1 ? Math.round((total - base * (people.length - 1)) * 100) / 100 : base,
        items: [],
        reasoning: '',
      }))
      setSplits(fallback)
      setError('AI split failed — fell back to equal split')
      setStep(4)
    } finally {
      setLoading(false)
    }
  }

  // --- Step 4: Mark paid ---
  const handleMarkPaid = async (person) => {
    setPaid((prev) => [...prev, person])
    if (splitId) {
      try {
        await splitPay(splitId, person)
        // Update localStorage
        const stored = localStorage.getItem(`split_${splitId}`)
        if (stored) {
          const data = JSON.parse(stored)
          data.paid = [...(data.paid || []), person]
          localStorage.setItem(`split_${splitId}`, JSON.stringify(data))
        }
      } catch {
        // non-critical, UI already updated
      }
    }
  }

  const computedTotal = receiptTotal || items.reduce((s, i) => s + (i.price || 0), 0)

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: 'var(--dark)' }}>
      <div className="max-w-lg mx-auto flex flex-col gap-6">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => (step === 0 ? navigate('/dashboard') : setStep((s) => s - 1))}
            style={{
              background: 'transparent',
              border: '1px solid rgba(247,242,236,0.15)',
              color: 'var(--muted)',
              borderRadius: 8,
              padding: '6px 12px',
              cursor: 'pointer',
              fontFamily: 'DM Sans',
              fontSize: 13,
            }}
          >
            ← Back
          </button>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: 'var(--cream)' }}>
            Split a Receipt 🧾
          </h1>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 4 }}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 2,
                background: i <= step ? '#E8341A' : 'rgba(247,242,236,0.1)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
        <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--muted)', marginTop: -8 }}>
          Step {step + 1} of {STEPS.length}: <strong style={{ color: 'var(--cream)' }}>{STEPS[step]}</strong>
        </p>

        {error && (
          <p style={{ color: '#E8341A', fontFamily: 'DM Sans', fontSize: 13 }}>{error}</p>
        )}

        <AnimatePresence mode="wait">

          {/* STEP 0: Upload */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4"
            >
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed #E8341A',
                  borderRadius: 12,
                  padding: '32px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: preview ? 'transparent' : '#1a1816',
                }}
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Receipt preview"
                    style={{ maxHeight: 300, borderRadius: 8, margin: '0 auto', display: 'block' }}
                  />
                ) : (
                  <>
                    <p style={{ fontSize: 40, marginBottom: 8 }}>📸</p>
                    <p style={{ fontFamily: 'DM Sans', fontWeight: 700, color: 'var(--cream)', fontSize: 14 }}>
                      Drop receipt here
                    </p>
                    <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                      JPG or PNG · max 10MB
                    </p>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              {selectedFile && (
                <button
                  className="btn-primary"
                  onClick={handleExtract}
                  disabled={loading}
                >
                  {loading ? 'Scanning receipt...' : 'Extract Items →'}
                </button>
              )}
            </motion.div>
          )}

          {/* STEP 1: Review items */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-3"
            >
              <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--muted)' }}>
                Review and edit the extracted items.
              </p>
              {items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    background: '#1a1816',
                    borderRadius: 8,
                    padding: '8px 12px',
                  }}
                >
                  <input
                    value={item.name}
                    onChange={(e) => updateItem(idx, 'name', e.target.value)}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--cream)',
                      fontFamily: 'DM Sans',
                      fontSize: 13,
                      outline: 'none',
                    }}
                    placeholder="Item name"
                  />
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => updateItem(idx, 'price', parseFloat(e.target.value) || 0)}
                    style={{
                      width: 70,
                      background: 'transparent',
                      border: 'none',
                      color: '#E8341A',
                      fontFamily: 'DM Sans',
                      fontWeight: 700,
                      fontSize: 13,
                      outline: 'none',
                      textAlign: 'right',
                    }}
                  />
                  <button
                    onClick={() => removeItem(idx)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--muted)',
                      cursor: 'pointer',
                      fontSize: 16,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}

              <button
                onClick={addItem}
                style={{
                  background: 'transparent',
                  border: '1px dashed rgba(247,242,236,0.2)',
                  color: 'var(--muted)',
                  borderRadius: 8,
                  padding: '8px',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans',
                  fontSize: 13,
                }}
              >
                + Add item
              </button>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderTop: '1px solid rgba(247,242,236,0.1)',
                }}
              >
                <span style={{ fontFamily: 'DM Sans', fontWeight: 700, color: 'var(--cream)', fontSize: 14 }}>
                  Total
                </span>
                <span style={{ fontFamily: 'DM Sans', fontWeight: 700, color: '#E8341A', fontSize: 14 }}>
                  ${computedTotal.toFixed(2)}
                </span>
              </div>

              <button className="btn-primary" onClick={() => setStep(2)}>
                Looks good →
              </button>
            </motion.div>
          )}

          {/* STEP 2: Add people */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4"
            >
              <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--muted)' }}>
                Who's splitting the bill?
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {people.map((p) => (
                  <div
                    key={p}
                    style={{
                      background: '#1a1816',
                      border: '1px solid rgba(232,52,26,0.3)',
                      borderRadius: 20,
                      padding: '5px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--cream)' }}>{p}</span>
                    {p !== 'You' && (
                      <button
                        onClick={() => removePerson(p)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--muted)',
                          cursor: 'pointer',
                          fontSize: 14,
                          lineHeight: 1,
                          padding: 0,
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addPerson()}
                  placeholder="Add a name..."
                  style={{
                    flex: 1,
                    background: '#1a1816',
                    border: '1px solid rgba(247,242,236,0.1)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: 'var(--cream)',
                    fontFamily: 'DM Sans',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={addPerson}
                  style={{
                    background: '#E8341A',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 16px',
                    color: 'white',
                    fontFamily: 'DM Sans',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
              </div>

              <button
                className="btn-primary"
                onClick={() => setStep(3)}
                disabled={people.length < 1}
              >
                Next →
              </button>
            </motion.div>
          )}

          {/* STEP 3: Choose split mode */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-3"
            >
              {[
                {
                  key: 'equal',
                  label: '⚖️ Equal Split',
                  desc: `$${(computedTotal / people.length).toFixed(2)} each (${people.length} people)`,
                },
                {
                  key: 'by_item',
                  label: '🍕 By Item',
                  desc: 'Assign who had what',
                },
                {
                  key: 'ai',
                  label: '🤖 AI Split',
                  desc: 'Claude suggests based on items',
                },
              ].map(({ key, label, desc }) => (
                <div
                  key={key}
                  onClick={() => setSplitMode(key)}
                  style={{
                    border: `2px solid ${splitMode === key ? '#E8341A' : 'rgba(247,242,236,0.1)'}`,
                    borderRadius: 10,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    background: splitMode === key ? 'rgba(232,52,26,0.08)' : '#1a1816',
                    transition: 'all 0.15s',
                  }}
                >
                  <p style={{ fontFamily: 'DM Sans', fontWeight: 700, color: 'var(--cream)', fontSize: 14 }}>
                    {label}
                  </p>
                  <p style={{ fontFamily: 'DM Sans', color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>
                    {desc}
                  </p>
                </div>
              ))}

              {/* By-item assignment UI */}
              {splitMode === 'by_item' && (
                <div style={{ marginTop: 8 }}>
                  <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                    Assign items to people (unassigned = split equally):
                  </p>
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 6,
                        background: '#1a1816',
                        borderRadius: 8,
                        padding: '6px 10px',
                      }}
                    >
                      <span style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--cream)', flex: 1 }}>
                        {item.name} <span style={{ color: '#E8341A' }}>${item.price.toFixed(2)}</span>
                      </span>
                      <select
                        value={item.assignedTo || ''}
                        onChange={(e) => updateItem(idx, 'assignedTo', e.target.value || null)}
                        style={{
                          background: '#0F0D0C',
                          border: '1px solid rgba(247,242,236,0.1)',
                          borderRadius: 6,
                          color: 'var(--cream)',
                          fontFamily: 'DM Sans',
                          fontSize: 11,
                          padding: '3px 6px',
                          marginLeft: 8,
                        }}
                      >
                        <option value="">Shared</option>
                        {people.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              )}

              <button
                className="btn-primary"
                onClick={handleCalculate}
                disabled={loading}
                style={{ marginTop: 8 }}
              >
                {loading ? 'Calculating...' : 'Calculate Split →'}
              </button>
            </motion.div>
          )}

          {/* STEP 4: Summary */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontFamily: 'DM Sans', fontWeight: 700, color: 'var(--cream)', fontSize: 15 }}>
                  💰 Who Owes What
                </p>
                <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--muted)' }}>
                  Total: ${computedTotal.toFixed(2)}
                </p>
              </div>

              <SplitSummary splits={splits} paid={paid} onMarkPaid={handleMarkPaid} />

              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(247,242,236,0.15)',
                  color: 'var(--muted)',
                  borderRadius: 8,
                  padding: '10px',
                  cursor: 'pointer',
                  fontFamily: 'DM Sans',
                  fontSize: 13,
                  marginTop: 8,
                }}
              >
                Back to Dashboard
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/SplitReceipt.jsx
git commit -m "feat: add 5-step SplitReceipt wizard with Claude Vision OCR"
```

---

## Task 10: Client Wiring (api/index.js + App.jsx + Dashboard.jsx)

**Files:**
- Modify: `client/src/api/index.js`
- Modify: `client/src/App.jsx`
- Modify: `client/src/pages/Dashboard.jsx`

- [ ] **Step 1: Replace `client/src/api/index.js`**

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

// --- Gmail ---

export async function fetchGmailTransactions() {
  const res = await fetch(`${BASE}/gmail/transactions`, { method: 'POST' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to fetch Gmail transactions')
  return data.transactions
}

// --- Receipt Splitter ---

export async function splitExtract(base64Image, mediaType = 'image/jpeg') {
  const res = await fetch(`${BASE}/split/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Image, mediaType }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to extract receipt')
  return data
}

export async function splitCalculate(items, people, mode) {
  const res = await fetch(`${BASE}/split/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, people, mode }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to calculate split')
  return data.splits
}

export async function splitSave(splitData) {
  const res = await fetch(`${BASE}/split/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(splitData),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to save split')
  return data.splitId
}

export async function splitPay(splitId, person) {
  const res = await fetch(`${BASE}/split/${splitId}/pay`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ person }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to mark paid')
  return data
}
```

- [ ] **Step 2: Update `client/src/App.jsx`** — add /split route

Replace the entire file:

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext.jsx'
import Landing from './pages/Landing.jsx'
import VillainReveal from './pages/VillainReveal.jsx'
import Dashboard from './pages/Dashboard.jsx'
import RedemptionChat from './pages/RedemptionChat.jsx'
import SplitReceipt from './pages/SplitReceipt.jsx'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/reveal" element={<VillainReveal />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat" element={<RedemptionChat />} />
          <Route path="/split" element={<SplitReceipt />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
```

- [ ] **Step 3: Add "Split a Receipt" button to `client/src/pages/Dashboard.jsx`**

Find the "Ask for Help" button block (lines ~223-230) and replace it with:

```jsx
        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
          <button
            className="btn-primary"
            onClick={() => navigate('/chat')}
          >
            Ask for Help (If You Dare)
          </button>
          <button
            onClick={() => navigate('/split')}
            style={{
              background: 'transparent',
              border: '1px solid rgba(232,52,26,0.4)',
              color: '#E8341A',
              fontFamily: 'DM Sans',
              fontWeight: 700,
              fontSize: 14,
              padding: '12px 24px',
              borderRadius: 8,
              cursor: 'pointer',
              letterSpacing: '0.04em',
              transition: 'border-color 0.15s',
            }}
          >
            Split a Receipt 🧾
          </button>
        </div>
```

The exact block to find and replace in Dashboard.jsx (current code):
```jsx
        {/* Ask for Help */}
        <button
          className="btn-primary"
          onClick={() => navigate('/chat')}
          style={{ marginBottom: 32 }}
        >
          Ask for Help (If You Dare)
        </button>
```

- [ ] **Step 4: Verify client builds without errors**

```bash
cd "client" && npx vite build 2>&1 | tail -20
```

Expected: `built in Xs` with no errors. Warnings about unused vars are acceptable.

- [ ] **Step 5: Commit**

```bash
git add src/api/index.js src/App.jsx src/pages/Dashboard.jsx
git commit -m "feat: wire up gmail + split APIs, add /split route and Dashboard button"
```

---

## Integration Smoke Test

After all tasks complete, verify the full system works:

- [ ] **Start server** (requires `.env` with `ANTHROPIC_API_KEY`, optionally `GOOGLE_CLIENT_ID/SECRET`)

```bash
cd "server" && npm run dev
```

- [ ] **Start client**

```bash
cd "client" && npm run dev
```

- [ ] **Demo Mode test** (no API keys needed)
  - Open `http://localhost:5173`
  - Verify consent box visible above "I Accept" button
  - Click "Try Demo Mode"
  - Verify villain reveal + dashboard load correctly
  - Verify "Split a Receipt 🧾" button visible on dashboard
  - Click it → verify SplitReceipt wizard opens at Step 1

- [ ] **Receipt Splitter test** (requires `ANTHROPIC_API_KEY`)
  - Upload a receipt photo
  - Verify items are extracted
  - Add 2 people, try Equal split
  - Verify Mark Paid updates the "Still owed" counter

- [ ] **Gmail test** (requires `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` in `.env`)
  - Click "I Accept — Connect My Bank"
  - Complete Plaid Sandbox flow
  - Verify Gmail OAuth popup opens automatically
  - Grant or deny access
  - Verify villain analysis proceeds either way
