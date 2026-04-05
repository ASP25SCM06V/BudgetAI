import cron from 'node-cron'
import { runHealthScoreScan } from './services/healthScoreService.js'
import { runSubscriptionScan } from './services/subscriptionService.js'
import { generateInsights } from './services/claudeService.js'
import { setInsights, setLastScanAt } from './store.js'

const SCAN_HOUR = process.env.DAILY_SCAN_HOUR || 6
const SCAN_MINUTE = process.env.DAILY_SCAN_MINUTE || 0

export async function runDailyScan(transactions = []) {
  if (!transactions.length) {
    console.log('[Scheduler] No transactions available — skipping scan')
    return
  }

  console.log('[Scheduler] Starting daily scan...')
  try {
    const [healthScore] = await Promise.all([
      runHealthScoreScan(transactions),
      runSubscriptionScan(transactions),
    ])

    const insights = await generateInsights(transactions, healthScore)
    setInsights(insights)
    setLastScanAt(new Date().toISOString())
    console.log('[Scheduler] Daily scan complete')
  } catch (err) {
    console.error('[Scheduler] Daily scan error:', err.message)
  }
}

export function startScheduler() {
  const schedule = `${SCAN_MINUTE} ${SCAN_HOUR} * * *`
  cron.schedule(schedule, () => {
    console.log(`[Scheduler] Cron fired at ${new Date().toISOString()} — no persistent transactions, skipping AI calls`)
    setLastScanAt(new Date().toISOString())
  })
  console.log(`[Scheduler] Daily scan scheduled for ${SCAN_HOUR}:${String(SCAN_MINUTE).padStart(2, '0')}`)
}
