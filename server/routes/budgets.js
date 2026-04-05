import { Router } from 'express'
import { getBudgets, setBudgets } from '../store.js'

const router = Router()

router.get('/budgets', (req, res) => {
  res.json({ budgets: getBudgets() })
})

router.post('/budgets', (req, res) => {
  const { budgets } = req.body
  if (!Array.isArray(budgets)) {
    return res.status(400).json({ error: 'budgets must be an array' })
  }
  const validated = budgets.map((b, i) => ({
    id: b.id || `budget_${i}`,
    category: String(b.category || ''),
    limit: Number(b.limit) || 0,
    spent: Number(b.spent) || 0,
    icon: b.icon || '💳',
  }))
  setBudgets(validated)
  res.json({ budgets: validated })
})

export default router
