import { Router } from 'express'
import { getInsights, setInsights, getHealthScore } from '../store.js'
import { generateInsights } from '../services/claudeService.js'

const router = Router()

router.get('/insights', (req, res) => {
  res.json({ insights: getInsights() })
})

router.post('/insights/refresh', async (req, res) => {
  try {
    const { transactions } = req.body
    if (!transactions || transactions.length === 0) {
      return res.status(400).json({ error: 'transactions required' })
    }
    const healthScore = getHealthScore()
    const insights = await generateInsights(transactions, healthScore)
    setInsights(insights)
    res.json({ insights })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
