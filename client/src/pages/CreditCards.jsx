import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import { analyzeCreditCards as analyzeCreditCardsAPI } from '../api/index.js'

const emptyCard = { name: '', balance: '', limit: '', apr: '', min_payment: '' }

export default function CreditCards() {
  const navigate = useNavigate()
  const { creditCards, setCreditCards, creditStrategy, setCreditStrategy, isDemoMode, addToast } = useApp()
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState(emptyCard)
  const [analyzing, setAnalyzing] = useState(false)

  const addCard = () => {
    if (!draft.name || !draft.balance) { addToast('Name and balance are required', 'warning'); return }
    const newCard = {
      id: `card_${Date.now()}`,
      name: draft.name,
      balance: parseFloat(draft.balance) || 0,
      limit: parseFloat(draft.limit) || 0,
      apr: parseFloat(draft.apr) || 0,
      min_payment: parseFloat(draft.min_payment) || 0,
      payoff_position: creditCards.length + 1,
    }
    setCreditCards([...creditCards, newCard])
    setDraft(emptyCard)
    setAdding(false)
    addToast(`${newCard.name} added`, 'success')
  }

  const analyze = async () => {
    if (creditCards.length === 0) { addToast('Add at least one card first', 'warning'); return }
    setAnalyzing(true)
    try {
      let result
      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 800))
        result = {
          cards: creditCards,
          strategy: {
            strategy: 'avalanche',
            strategy_reason: 'Avalanche targets your highest-APR card first, minimizing total interest paid.',
            estimated_savings: 340,
            payoff_order: creditCards.map((c) => c.name),
            aria_recommendation: "Pay an extra $100/month on your highest-APR card — you'll save hundreds in interest.",
          },
        }
      } else {
        result = await analyzeCreditCardsAPI(creditCards)
      }
      setCreditCards(result.cards || creditCards)
      setCreditStrategy(result.strategy)
      addToast('Analysis complete!', 'success')
    } catch {
      addToast('Analysis failed. Try again.', 'error')
    }
    setAnalyzing(false)
  }

  const utilizationColor = (balance, limit) => {
    if (!limit) return 'var(--text-muted)'
    const pct = balance / limit
    if (pct > 0.75) return 'var(--danger)'
    if (pct > 0.5) return 'var(--warning)'
    return 'var(--positive)'
  }

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: 80 }} className="md:pl-[220px]">
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>

        <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px', marginBottom: 20 }} onClick={() => navigate('/dashboard')}>
          ← Back
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 26, color: 'var(--text-primary)' }}>
              Credit Cards
            </h1>
            <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Track balances and get Aria's payoff strategy.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-ghost" onClick={() => setAdding(true)} style={{ fontSize: 12 }}>+ Add Card</button>
            <button className="btn-accent" onClick={analyze} disabled={analyzing || creditCards.length === 0} style={{ fontSize: 12 }}>
              {analyzing ? 'Analyzing...' : 'Ask Aria ✨'}
            </button>
          </div>
        </div>

        {/* Strategy Banner */}
        {creditStrategy && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="surface"
            style={{ marginBottom: 20, borderColor: 'rgba(99,102,241,0.5)', background: 'rgba(99,102,241,0.08)' }}
          >
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 28 }}>✨</span>
              <div>
                <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Aria recommends:{' '}
                  <span style={{ color: 'var(--accent-primary)', textTransform: 'capitalize' }}>{creditStrategy.strategy}</span> method
                </p>
                <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {creditStrategy.strategy_reason}
                </p>
                <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--positive)', marginTop: 8, fontWeight: 600 }}>
                  {creditStrategy.aria_recommendation}
                </p>
                {creditStrategy.estimated_savings > 0 && (
                  <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    Estimated interest saved: ${creditStrategy.estimated_savings}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Cards list */}
        {creditCards.length === 0 && !adding ? (
          <div className="surface" style={{ textAlign: 'center', padding: 48 }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>💳</p>
            <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 8 }}>
              No cards added
            </p>
            <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Add your credit cards to get a personalized payoff strategy from Aria.
            </p>
            <button className="btn-accent" onClick={() => setAdding(true)}>Add Your First Card</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {creditCards.map((card, i) => {
              const utilization = card.limit > 0 ? (card.balance / card.limit) * 100 : 0
              const uColor = utilizationColor(card.balance, card.limit)
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="surface"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                        {card.name}
                        {creditStrategy?.payoff_order && (
                          <span style={{ marginLeft: 8, fontFamily: 'DM Sans', fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
                            Payoff #{creditStrategy.payoff_order.indexOf(card.name) + 1}
                          </span>
                        )}
                      </p>
                      <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        APR: {card.apr}% · Min payment: ${card.min_payment}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: 'var(--text-primary)' }}>
                        ${card.balance.toLocaleString()}
                      </p>
                      {card.limit > 0 && (
                        <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: uColor, marginTop: 2 }}>
                          {utilization.toFixed(0)}% utilization
                        </p>
                      )}
                    </div>
                  </div>

                  {card.limit > 0 && (
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(utilization, 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ height: '100%', background: uColor, borderRadius: 99 }}
                      />
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Add card form */}
        {adding && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="surface">
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 16 }}>
              Add a Credit Card
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { key: 'name',        label: 'Card Name',        placeholder: 'e.g. Chase Visa', span: true },
                { key: 'balance',     label: 'Balance ($)',       placeholder: '2500' },
                { key: 'limit',       label: 'Credit Limit ($)',  placeholder: '5000' },
                { key: 'apr',         label: 'APR (%)',           placeholder: '22.99' },
                { key: 'min_payment', label: 'Min Payment ($)',   placeholder: '35' },
              ].map((field) => (
                <div key={field.key} style={field.span ? { gridColumn: '1 / -1' } : {}}>
                  <label style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                    {field.label}
                  </label>
                  <input
                    type={field.key === 'name' ? 'text' : 'number'}
                    value={draft[field.key]}
                    placeholder={field.placeholder}
                    onChange={(e) => setDraft({ ...draft, [field.key]: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 12px',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                      borderRadius: 8, color: 'var(--text-primary)',
                      fontFamily: 'DM Sans', fontSize: 14, outline: 'none',
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-accent" onClick={addCard} style={{ fontSize: 13, padding: '10px 24px' }}>
                Add Card
              </button>
              <button className="btn-ghost" onClick={() => { setAdding(false); setDraft(emptyCard) }}>
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
