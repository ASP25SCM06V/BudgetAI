import { Router } from 'express'
import { getHealthScore } from '../store.js'
import { runHealthScoreScan } from '../services/healthScoreService.js'

const router = Router()

router.get('/health-score', (req, res) => {
  const score = getHealthScore()
  if (!score) return res.json({ score: null })
  res.json({ score })
})

router.post('/health-score/compute', async (req, res) => {
  try {
    const { transactions } = req.body
    if (!transactions || transactions.length === 0) {
      return res.status(400).json({ error: 'transactions required' })
    }
    const score = await runHealthScoreScan(transactions)
    res.json({ score })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
