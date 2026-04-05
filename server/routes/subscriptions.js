import { Router } from 'express'
import { getSubscriptions, updateSubscription } from '../store.js'
import { runSubscriptionScan } from '../services/subscriptionService.js'

const router = Router()

router.get('/subscriptions', (req, res) => {
  res.json({ subscriptions: getSubscriptions() })
})

router.post('/subscriptions/scan', async (req, res) => {
  try {
    const { transactions } = req.body
    if (!transactions || transactions.length === 0) {
      return res.status(400).json({ error: 'transactions required' })
    }
    const subscriptions = await runSubscriptionScan(transactions)
    res.json({ subscriptions })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/subscriptions/:id', (req, res) => {
  const { id } = req.params
  const { status } = req.body
  if (!['active', 'unused', 'cancelled', 'keep'].includes(status)) {
    return res.status(400).json({ error: 'invalid status' })
  }
  updateSubscription(id, { status })
  res.json({ ok: true, subscriptions: getSubscriptions() })
})

export default router
