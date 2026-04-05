import express from 'express'
import { getGmailTokens } from '../store.js'
import { fetchGmailTransactions } from '../services/gmailService.js'

const router = express.Router()

router.post('/gmail/transactions', async (req, res, next) => {
  try {
    const tokens = getGmailTokens()
    if (!tokens) {
      return res.status(401).json({ error: 'Gmail not connected' })
    }
    const transactions = await fetchGmailTransactions(tokens)
    res.json({ transactions })
  } catch (e) {
    next(e)
  }
})

export default router
