import { Router } from 'express'
import { getAriaAdvice } from '../services/claudeService.js'

const router = Router()

router.post('/aria/advice', async (req, res) => {
  try {
    const { message, tx_summary } = req.body
    if (!message) return res.status(400).json({ error: 'message required' })
    const advice = await getAriaAdvice(message, tx_summary || '')
    res.json({ advice })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
