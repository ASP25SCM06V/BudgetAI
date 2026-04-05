import { detectSubscriptions } from './claudeService.js'
import { getSubscriptions, setSubscriptions } from '../store.js'

export async function runSubscriptionScan(transactions) {
  if (!transactions || transactions.length === 0) return []

  try {
    const detected = await detectSubscriptions(transactions)
    // Merge with existing — preserve user-set statuses (keep/cancel)
    const existing = getSubscriptions()
    const merged = detected.map((s) => {
      const prev = existing.find((e) => e.id === s.id || e.name === s.name)
      return prev ? { ...s, status: prev.status } : s
    })
    setSubscriptions(merged)
    return merged
  } catch (err) {
    console.error('Subscription scan failed:', err.message)
    return getSubscriptions()
  }
}

export function detectFromTransactionsLocal(transactions) {
  // Local heuristic: group by merchant_name, find charges appearing 2+ times
  const counts = {}
  for (const tx of transactions) {
    const key = (tx.merchant_name || '').toLowerCase()
    if (!key) continue
    if (!counts[key]) counts[key] = { name: tx.merchant_name, amount: tx.amount, dates: [], category: tx.category }
    counts[key].dates.push(tx.date)
  }

  return Object.values(counts)
    .filter((s) => s.dates.length >= 2)
    .map((s, i) => ({
      id: `sub_local_${i}`,
      name: s.name,
      amount: s.amount,
      frequency: 'monthly',
      category: s.category || 'Subscription',
      last_charged: s.dates.sort().reverse()[0],
      status: 'active',
      usage_signal: `Appeared ${s.dates.length} times in your transactions`,
    }))
}
