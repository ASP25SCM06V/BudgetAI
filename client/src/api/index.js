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

// ── BudgetAI v2 API ──────────────────────────────────────────────────

export async function fetchInsights() {
  const res = await fetch(`${BASE}/insights`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to fetch insights')
  return data.insights
}

export async function refreshInsights(transactions) {
  const res = await fetch(`${BASE}/insights/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactions }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to refresh insights')
  return data.insights
}

export async function fetchSubscriptions() {
  const res = await fetch(`${BASE}/subscriptions`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to fetch subscriptions')
  return data.subscriptions
}

export async function scanSubscriptions(transactions) {
  const res = await fetch(`${BASE}/subscriptions/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactions }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to scan subscriptions')
  return data.subscriptions
}

export async function updateSubscriptionStatus(id, status) {
  const res = await fetch(`${BASE}/subscriptions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to update subscription')
  return data.subscriptions
}

export async function fetchBudgets() {
  const res = await fetch(`${BASE}/budgets`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to fetch budgets')
  return data.budgets
}

export async function saveBudgets(budgets) {
  const res = await fetch(`${BASE}/budgets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ budgets }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to save budgets')
  return data.budgets
}

export async function fetchCreditCards() {
  const res = await fetch(`${BASE}/credit-cards`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to fetch credit cards')
  return data
}

export async function analyzeCreditCards(cards) {
  const res = await fetch(`${BASE}/credit-cards/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cards }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to analyze credit cards')
  return data
}

export async function fetchHealthScore() {
  const res = await fetch(`${BASE}/health-score`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to fetch health score')
  return data.score
}

export async function computeHealthScore(transactions) {
  const res = await fetch(`${BASE}/health-score/compute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transactions }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to compute health score')
  return data.score
}

export async function getAriaAdvice(message, tx_summary) {
  const res = await fetch(`${BASE}/aria/advice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, tx_summary }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to get advice')
  return data.advice
}
