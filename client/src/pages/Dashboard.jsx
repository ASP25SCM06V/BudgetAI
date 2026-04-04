import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import HPBar from '../components/HPBar.jsx'
import SpendChart from '../components/SpendChart.jsx'
import TransactionRoastItem from '../components/TransactionRoastItem.jsx'
import VillainCardShare from '../components/VillainCardShare.jsx'
import { roastTransaction } from '../api/index.js'

const demoRoasts = [
  "Starbucks three days in a row? Your barista has a name for your order. It's called 'the sad latte'.",
  "Another Starbucks. The beans are free if you just... stop going.",
  "Day three of Starbucks. Have you considered owning a coffee maker? Wild concept.",
  "Uber Eats at dinner time — a classic cry for help wrapped in a delivery fee.",
  "Uber Eats again. Your stove is literally right there. It doesn't bite.",
  "DoorDash too? You're single-handedly funding three drivers' car payments.",
  "Netflix, Spotify, AND Hulu? You're paying for three streaming services and still say you're bored.",
  "Spotify Premium so you don't hear ads. The irony of spending money to avoid being reminded you spend money.",
  "Hulu with ads would've saved you $6. That's two coffees. You'll spend them at Starbucks anyway.",
  "Amazon Prime — for the privilege of buying things you didn't need, faster.",
  "$67 at Amazon. Did you even need any of that? Asking for your future self.",
  "Another Amazon order. Jeff Bezos thanks you personally.",
  "$112 at Target. You went in for one thing. You always go in for one thing.",
  "Walgreens impulse buy — the most expensive convenience on earth.",
  "Chipotle. Respectable. Predictable. Still $14 for a burrito.",
  "McDonald's at an undisclosed hour. No judgment. Some judgment.",
  "Discord Nitro for animated emojis. The economy is fine.",
  "Notion subscription — for the productivity system you set up once and never opened again.",
  "$52 to Grubhub. That's a full week of groceries. I hope it was worth it.",
  "Taco Bell at the end of the month. The financial cycle is complete.",
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { villain, transactions, hp, setHp, isDemoMode } = useApp()

  const [roasts, setRoasts] = useState({})
  const [loadingRoasts, setLoadingRoasts] = useState(false)
  const [savingsGoal, setSavingsGoal] = useState('')
  const [dealDamageAnim, setDealDamageAnim] = useState(false)
  const [defeated, setDefeated] = useState(false)
  const [showShare, setShowShare] = useState(false)

  useEffect(() => {
    if (!villain || !transactions.length) return
    loadRoasts()
  }, [villain, transactions])

  const loadRoasts = async () => {
    setLoadingRoasts(true)

    if (isDemoMode) {
      const preloaded = {}
      transactions.slice(0, 20).forEach((_, i) => {
        preloaded[i] = demoRoasts[i] || 'No comment. Even I have limits.'
      })
      setRoasts(preloaded)
      setLoadingRoasts(false)
      return
    }

    const top20 = transactions.slice(0, 20)
    for (let i = 0; i < top20.length; i += 5) {
      const batchRoasts = {}
      const batch = top20.slice(i, i + 5)
      await Promise.all(
        batch.map(async (tx, idx) => {
          try {
            const taunt = await roastTransaction(tx, villain.villain_type)
            batchRoasts[i + idx] = taunt
          } catch {
            batchRoasts[i + idx] = 'Even I refuse to comment on this one.'
          }
        })
      )
      setRoasts((prev) => ({ ...prev, ...batchRoasts }))
    }
    setLoadingRoasts(false)
  }

  const dealDamage = () => {
    const goal = parseFloat(savingsGoal)
    if (!goal || goal <= 0) return
    const damage = Math.min(hp, Math.round((goal / 500) * 25))
    setDealDamageAnim(true)
    setTimeout(() => {
      setHp((prev) => {
        const newHp = Math.max(0, prev - damage)
        if (newHp === 0) setDefeated(true)
        return newHp
      })
      setDealDamageAnim(false)
    }, 400)
    setSavingsGoal('')
  }

  if (!villain) {
    navigate('/')
    return null
  }

  const top20 = transactions.slice(0, 20)

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: 'var(--dark)' }}>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, color: 'var(--cream)' }}>
            Shame Dashboard
          </h1>
          <button
            onClick={() => setShowShare(true)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(247,242,236,0.15)',
              color: 'var(--muted)',
              fontFamily: 'DM Sans',
              fontSize: 12,
              padding: '8px 14px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Share Card
          </button>
        </div>

        {/* Villain HP card */}
        <div className="card">
          <div className="flex items-center gap-4 mb-4">
            <span style={{ fontSize: 40 }}>{villain.villain_emoji}</span>
            <div>
              <p style={{ fontFamily: 'DM Sans', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>
                Current Villain
              </p>
              <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 18, color: 'var(--dark)' }}>
                {villain.villain_name}
              </p>
            </div>
          </div>
          <HPBar hp={hp} />
          <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
            {villain.worst_stat}
          </p>
        </div>

        {/* Defeat animation */}
        <AnimatePresence>
          {defeated && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="card text-center"
              style={{ border: '1px solid #E8341A' }}
            >
              <p style={{ fontSize: 48 }}>🏆</p>
              <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: 'var(--dark)', marginTop: 8 }}>
                You defeated {villain.villain_name}!
              </h2>
              <p style={{ fontFamily: 'DM Sans', fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>
                Financial discipline: 1. Villain: 0.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Savings goal / Deal Damage */}
        {!defeated && (
          <div className="card">
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--dark)', marginBottom: 8 }}>
              Deal Damage
            </h3>
            <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
              Set a monthly savings goal to damage your villain.
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="e.g. 200"
                value={savingsGoal}
                onChange={(e) => setSavingsGoal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && dealDamage()}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '0.5px solid rgba(15,13,12,0.2)',
                  fontFamily: 'DM Sans',
                  fontSize: 14,
                  color: 'var(--dark)',
                  outline: 'none',
                }}
              />
              <motion.button
                className="btn-primary"
                onClick={dealDamage}
                animate={dealDamageAnim ? { scale: [1, 0.9, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
                style={{ fontSize: 13, padding: '10px 20px' }}
              >
                Deal Damage ⚔️
              </motion.button>
            </div>
          </div>
        )}

        {/* Spend Chart */}
        {transactions.length > 0 && <SpendChart transactions={transactions} />}

        {/* Transaction Roast Feed */}
        <div>
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--cream)', marginBottom: 12 }}>
            Transaction Roast Feed{loadingRoasts ? ' (loading taunts...)' : ''}
          </h3>
          {top20.map((tx, i) => (
            <TransactionRoastItem key={i} transaction={tx} taunt={roasts[i]} />
          ))}
        </div>

        {/* Ask for Help */}
        <button
          className="btn-primary"
          onClick={() => navigate('/chat')}
          style={{ marginBottom: 32 }}
        >
          Ask for Help (If You Dare)
        </button>
      </div>

      <AnimatePresence>
        {showShare && (
          <VillainCardShare villain={villain} onClose={() => setShowShare(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
