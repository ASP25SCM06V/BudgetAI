import { Router } from 'express'
import { analyzeTransactions, roastTransaction, getVillainAdvice } from '../services/claudeService.js'

const router = Router()

router.post('/analyze', async (req, res) => {
  try {
    const { transactions } = req.body
    if (!transactions?.length) return res.status(400).json({ error: 'No transactions provided' })
    const villain = await analyzeTransactions(transactions)
    res.json(villain)
  } catch (err) {
    console.error('analyze error:', err.message)
    res.status(500).json({ error: 'Failed to analyze transactions' })
  }
})

router.post('/roast', async (req, res) => {
  try {
    const { transaction, villain_type } = req.body
    const taunt = await roastTransaction(transaction, villain_type)
    res.json({ taunt })
  } catch (err) {
    console.error('roast error:', err.message)
    res.status(500).json({ error: 'Failed to roast transaction' })
  }
})

router.post('/advice', async (req, res) => {
  try {
    const { message, tx_summary, villain_type } = req.body
    const advice = await getVillainAdvice(message, tx_summary, villain_type)
    res.json({ advice })
  } catch (err) {
    console.error('advice error:', err.message)
    res.status(500).json({ error: 'Failed to get advice' })
  }
})

export default router
