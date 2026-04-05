import { computeHealthScore } from './claudeService.js'
import { getHealthScore, setHealthScore } from '../store.js'

export async function runHealthScoreScan(transactions) {
  if (!transactions || transactions.length === 0) return getHealthScore()

  try {
    const score = await computeHealthScore(transactions)
    score.computed_at = new Date().toISOString()
    setHealthScore(score)
    return score
  } catch (err) {
    console.error('Health score scan failed:', err.message)
    return getHealthScore()
  }
}

export function buildFallbackScore() {
  return {
    score: 50,
    grade: 'C',
    summary: 'Could not compute score — connect your bank for a real analysis.',
    categories: { spending_control: 50, subscription_efficiency: 50, savings_rate: 50, diversity: 50 },
    top_insight: 'Connect your bank account to get your personalized financial health score.',
    computed_at: new Date().toISOString(),
  }
}
