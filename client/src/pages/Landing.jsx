import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlaidLink } from 'react-plaid-link'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import {
  createLinkToken,
  exchangeToken,
  fetchTransactions,
  fetchGmailTransactions,
  computeHealthScore,
  scanSubscriptions,
  refreshInsights,
} from '../api/index.js'
import {
  demoTransactions,
  demoHealthScore,
  demoSubscriptions,
  demoBudgets,
  demoCreditCards,
  demoCreditStrategy,
  demoInsights,
} from '../data/demoData.js'

function mergeAndDeduplicate(plaid, gmail) {
  const key = (t) => `${(t.merchant_name || '').toLowerCase()}|${t.amount}|${t.date}`
  const plaidKeys = new Set(plaid.map(key))
  const unique = gmail.filter((t) => !plaidKeys.has(key(t)))
  return [...plaid, ...unique]
}

function openGmailPopup() {
  return new Promise((resolve, reject) => {
    const popup = window.open(
      'http://localhost:3001/api/auth/google',
      'gmail_oauth',
      'width=500,height=620,top=100,left=100'
    )
    if (!popup) { reject(new Error('Popup blocked')); return }

    const handler = (event) => {
      if (event.origin !== 'http://localhost:3001') return
      window.removeEventListener('message', handler)
      if (event.data?.type === 'GMAIL_AUTH_SUCCESS') resolve()
      else reject(new Error(event.data?.error || 'Gmail auth failed'))
    }
    window.addEventListener('message', handler)

    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer)
        window.removeEventListener('message', handler)
        reject(new Error('Popup closed'))
      }
    }, 500)
  })
}

const features = [
  { icon: '📊', label: 'Financial Health Score', desc: 'AI-computed 0-100 score updated daily' },
  { icon: '✨', label: 'Aria AI Coach', desc: 'Ask anything — warm, specific, actionable' },
  { icon: '🔄', label: 'Subscription Radar', desc: 'Find and cancel unused subscriptions' },
  { icon: '🎯', label: 'Smart Budgets', desc: 'Category budgets with live progress' },
  { icon: '💳', label: 'Credit Card Strategy', desc: 'Avalanche or snowball — Aria decides' },
  { icon: '🧾', label: 'Receipt Splitter', desc: 'OCR-powered bill splitting in 5 steps' },
]

export default function Landing() {
  const navigate = useNavigate()
  const {
    setTransactions, setIsDemoMode,
    setHealthScore, setInsights, setSubscriptions,
    setBudgets, setCreditCards, setCreditStrategy,
  } = useApp()
  const [linkToken, setLinkToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const handleDemoMode = () => {
    setIsDemoMode(true)
    setTransactions(demoTransactions)
    setHealthScore(demoHealthScore)
    setInsights(demoInsights)
    setSubscriptions(demoSubscriptions)
    setBudgets(demoBudgets)
    setCreditCards(demoCreditCards)
    setCreditStrategy(demoCreditStrategy)
    navigate('/dashboard')
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

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken) => {
      try {
        setStatus('Connecting to bank...')
        await exchangeToken(publicToken)
        setStatus('Fetching your transactions...')
        const plaidTx = await fetchTransactions()

        let gmailTx = []
        try {
          setStatus('Connecting Gmail...')
          await openGmailPopup()
          setStatus('Scanning financial emails...')
          gmailTx = await fetchGmailTransactions()
        } catch {
          setStatus('Gmail skipped — using bank data only')
          await new Promise((r) => setTimeout(r, 1000))
        }

        const merged = mergeAndDeduplicate(plaidTx, gmailTx)
        setTransactions(merged)
        setIsDemoMode(false)

        setStatus('Computing your health score...')
        const [hs, subs, insights] = await Promise.all([
          computeHealthScore(merged).catch(() => null),
          scanSubscriptions(merged).catch(() => []),
          refreshInsights(merged).catch(() => []),
        ])

        if (hs) setHealthScore(hs)
        setSubscriptions(subs)
        setInsights(insights)
        navigate('/dashboard')
      } catch (e) {
        setError(e.message)
        setLoading(false)
        setStatus('')
      }
    },
    onExit: () => { setLoading(false); setStatus(''); setLinkToken(null) },
  })

  useEffect(() => { if (linkToken && ready) open() }, [linkToken, ready, open])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Hero */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-6 max-w-lg w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            style={{
              width: 72, height: 72, borderRadius: 20,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36,
            }}
          >
            ✨
          </motion.div>

          <div>
            <h1 style={{
              fontFamily: 'Syne', fontSize: 'clamp(48px, 10vw, 72px)',
              fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1,
            }}>
              Budget<span style={{ color: 'var(--accent-primary)' }}>AI</span>
            </h1>
            <p style={{
              fontFamily: 'DM Sans', fontSize: 18,
              color: 'var(--text-secondary)', fontWeight: 300, marginTop: 12,
            }}>
              Your money, understood.
            </p>
          </div>

          {/* Consent block */}
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 12, padding: '16px 18px',
            textAlign: 'left', width: '100%', maxWidth: 340,
            fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7,
          }}>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8, fontSize: 13, fontFamily: 'DM Sans' }}>
              By continuing you allow BudgetAI to:
            </p>
            {[
              'Read bank transactions securely via Plaid',
              'Scan Gmail for financial emails (receipts, subscriptions, alerts)',
              'Analyze your spending with AI to build your financial health score',
            ].map((item) => (
              <div key={item} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--positive)', flexShrink: 0 }}>✓</span>
                <span style={{ fontFamily: 'DM Sans' }}>{item}</span>
              </div>
            ))}
            <p style={{
              marginTop: 10, paddingTop: 10,
              borderTop: '1px solid var(--border)',
              fontSize: 10, fontFamily: 'DM Sans', color: 'var(--text-muted)',
            }}>
              No data stored permanently. Read-only access.
            </p>
          </div>

          {error && <p style={{ color: 'var(--danger)', fontFamily: 'DM Sans', fontSize: 14 }}>{error}</p>}
          {status && !error && <p style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans', fontSize: 14 }}>{status}</p>}

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button className="btn-accent" onClick={handleConnectBank} disabled={loading}
              style={{ padding: '14px 32px', fontSize: 14 }}>
              {loading ? 'Connecting...' : 'Connect My Bank \u2192 Get Your Score'}
            </button>
            <button className="btn-ghost" onClick={handleDemoMode} disabled={loading}>
              Try Demo Mode
            </button>
          </div>

          <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--text-muted)', opacity: 0.6 }}>
            Plaid Sandbox + Gmail read-only · No real data stored
          </p>
        </motion.div>
      </div>

      {/* Features grid */}
      <div style={{ padding: '60px 24px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: 'var(--text-primary)', textAlign: 'center', marginBottom: 40 }}>
          Smarter than Rocket Money
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
              className="surface"
            >
              <span style={{ fontSize: 28 }}>{f.icon}</span>
              <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginTop: 10, marginBottom: 4 }}>
                {f.label}
              </p>
              <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--text-secondary)' }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
