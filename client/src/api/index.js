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
