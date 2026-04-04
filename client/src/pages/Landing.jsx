import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlaidLink } from 'react-plaid-link'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import { createLinkToken, exchangeToken, fetchTransactions, analyzeTransactions } from '../api/index.js'
import { demoTransactions } from '../data/demoData.js'

export default function Landing() {
  const navigate = useNavigate()
  const { setTransactions, setVillain, setIsDemoMode } = useApp()
  const [linkToken, setLinkToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const demoVillain = {
    villain_type: 'latte_phantom',
    villain_name: 'The Latte Phantom',
    villain_emoji: '☕',
    villain_description: 'You haunt every coffee shop within a 2-mile radius, leaving a trail of empty cups and broken savings goals. Starbucks knows your order by heart — and so does your bank statement.',
    signature_taunts: [
      'You spent $22.60 at Starbucks in 3 days. A bag of beans costs $12 and lasts a month. Do the math... actually, please don\'t.',
      'Uber Eats at 11pm again? Your future self is weeping into a cup of instant ramen.',
      '$52 to Grubhub in one order? A personal chef would\'ve been cheaper. And classier.',
    ],
    worst_stat: 'You spent $169.05 on food delivery and coffee in 90 days — enough for 14 months of Netflix.',
    hp: 100,
  }

  const runFullFlow = async (transactions, isDemo = false) => {
    setStatus('Analyzing your spending sins...')
    const villain = isDemo ? demoVillain : await analyzeTransactions(transactions)
    setTransactions(transactions)
    setVillain(villain)
    setIsDemoMode(isDemo)
    navigate('/reveal')
  }

  const handleConnectBank = async () => {
    setLoading(true)
    setError('')
    try {
      setStatus('Creating secure link...')
      const token = await createLinkToken()
      setLinkToken(token)
    } catch (e) {
      setError(e.message)
      setLoading(false)
      setStatus('')
    }
  }

  const handleDemoMode = async () => {
    setLoading(true)
    setError('')
    try {
      await runFullFlow(demoTransactions, true)
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken) => {
      try {
        setStatus('Connecting to bank...')
        await exchangeToken(publicToken)
        setStatus('Fetching your shameful transactions...')
        const transactions = await fetchTransactions()
        await runFullFlow(transactions, false)
      } catch (e) {
        setError(e.message)
        setLoading(false)
        setStatus('')
      }
    },
    onExit: () => {
      setLoading(false)
      setStatus('')
      setLinkToken(null)
    },
  })

  useEffect(() => {
    if (linkToken && ready) {
      open()
    }
  }, [linkToken, ready, open])

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: 'var(--dark)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center gap-6 max-w-lg w-full"
      >
        <motion.p
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          style={{ fontSize: 72, lineHeight: 1 }}
        >
          💀
        </motion.p>

        <div>
          <h1
            style={{
              fontFamily: 'Syne',
              fontSize: 'clamp(48px, 10vw, 80px)',
              fontWeight: 800,
              color: 'var(--cream)',
              lineHeight: 1,
            }}
          >
            SpendShame
          </h1>
          <p
            style={{
              fontFamily: 'DM Sans',
              fontSize: 18,
              color: 'var(--muted)',
              fontWeight: 300,
              marginTop: 12,
            }}
          >
            Your money has a villain.{' '}
            <span style={{ color: '#E8341A', fontWeight: 500 }}>His name is you.</span>
          </p>
        </div>

        {error && (
          <p style={{ color: '#E8341A', fontFamily: 'DM Sans', fontSize: 14 }}>{error}</p>
        )}

        {status && !error && (
          <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans', fontSize: 14 }}>{status}</p>
        )}

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            className="btn-primary"
            onClick={handleConnectBank}
            disabled={loading}
          >
            {loading ? 'Connecting...' : 'Connect My Bank'}
          </button>

          <button
            onClick={handleDemoMode}
            disabled={loading}
            style={{
              background: 'transparent',
              border: '1px solid rgba(247,242,236,0.2)',
              color: 'var(--muted)',
              fontFamily: 'DM Sans',
              fontSize: 14,
              padding: '12px 24px',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.45 : 1,
              transition: 'border-color 0.15s',
            }}
          >
            Try Demo Mode
          </button>
        </div>

        <p
          style={{
            fontFamily: 'DM Sans',
            fontSize: 12,
            color: 'var(--muted)',
            opacity: 0.5,
          }}
        >
          Plaid Sandbox • No real data stored
        </p>
      </motion.div>
    </div>
  )
}
