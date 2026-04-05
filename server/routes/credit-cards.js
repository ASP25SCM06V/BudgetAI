import { Router } from 'express'
import { getCreditCards } from '../store.js'
import { runCreditCardAnalysis } from '../services/creditCardService.js'

const router = Router()

router.get('/credit-cards', (req, res) => {
  res.json({ cards: getCreditCards(), strategy: null })
})

router.post('/credit-cards/analyze', async (req, res) => {
  try {
    const { cards } = req.body
    if (!Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ error: 'cards array required' })
    }
    const result = await runCreditCardAnalysis(cards)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
