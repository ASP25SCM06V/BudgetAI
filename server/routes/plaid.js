import { Router } from 'express'
import { createLinkToken, exchangePublicToken, getTransactions } from '../services/plaidService.js'
import { setAccessToken, getAccessToken } from '../store.js'

const router = Router()

router.post('/create_link_token', async (req, res) => {
  try {
    const linkToken = await createLinkToken()
    res.json({ link_token: linkToken })
  } catch (err) {
    console.error('create_link_token error:', err.response?.data || err.message)
    res.status(500).json({ error: 'Failed to create link token' })
  }
})

router.post('/exchange_token', async (req, res) => {
  try {
    const { public_token } = req.body
    const accessToken = await exchangePublicToken(public_token)
    setAccessToken(accessToken)
    res.json({ success: true })
  } catch (err) {
    console.error('exchange_token error:', err.response?.data || err.message)
    res.status(500).json({ error: 'Failed to exchange token' })
  }
})

router.post('/transactions', async (req, res) => {
  try {
    const accessToken = getAccessToken()
    if (!accessToken) return res.status(400).json({ error: 'No access token. Connect bank first.' })
    const transactions = await getTransactions(accessToken)
    res.json({ transactions })
  } catch (err) {
    console.error('transactions error:', err.response?.data || err.message)
    res.status(500).json({ error: 'Failed to fetch transactions' })
  }
})

export default router
