import express from 'express'
import {
  extractReceiptData,
  calculateSplit,
  saveSplit,
  getSplit,
  markPersonPaid,
} from '../services/splitService.js'

const router = express.Router()

// POST /api/split/extract — receives base64 image, returns line items + totals
router.post('/split/extract', async (req, res, next) => {
  try {
    const { base64Image, mediaType } = req.body
    if (!base64Image) {
      return res.status(400).json({ error: 'base64Image is required' })
    }
    const data = await extractReceiptData(base64Image, mediaType || 'image/jpeg')
    res.json(data)
  } catch (e) {
    next(e)
  }
})

// POST /api/split/calculate — receives { items, people, mode }, returns splits array
router.post('/split/calculate', async (req, res, next) => {
  try {
    const { items, people, mode } = req.body
    if (!items || !people || !mode) {
      return res.status(400).json({ error: 'items, people, and mode are required' })
    }
    const result = await calculateSplit(items, people, mode)
    res.json({ splits: result })
  } catch (e) {
    next(e)
  }
})

// POST /api/split/save — saves split state, returns splitId
router.post('/split/save', (req, res, next) => {
  try {
    const id = saveSplit(req.body)
    res.json({ splitId: id })
  } catch (e) {
    next(e)
  }
})

// GET /api/split/:id — fetch split by ID
router.get('/split/:id', (req, res) => {
  const split = getSplit(req.params.id)
  if (!split) return res.status(404).json({ error: 'Split not found' })
  res.json(split)
})

// PATCH /api/split/:id/pay — mark a person as paid
router.patch('/split/:id/pay', (req, res) => {
  const { person } = req.body
  if (!person) return res.status(400).json({ error: 'person is required' })
  const split = markPersonPaid(req.params.id, person)
  if (!split) return res.status(404).json({ error: 'Split not found' })
  res.json(split)
})

export default router
