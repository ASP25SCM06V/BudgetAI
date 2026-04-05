import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import { getAriaAdvice } from '../api/index.js'

const demoResponses = [
  "Your biggest opportunity right now is food delivery — $363 in 30 days is on the high side. Try cooking 2 nights a week and you could save $100-120/month easily.",
  "I'd tackle your Chase Visa first since it has the higher interest rate at 22.99%. Pay $100 extra per month and you'll clear it 8 months faster, saving $340 in interest.",
  "Adobe Creative Cloud at $54.99/month with no apparent usage is the clearest win here. That's $660/year back in your pocket.",
  "Your savings rate is actually solid — top 25% for your spending level. I'd focus on optimizing your subscriptions before cutting lifestyle spending.",
  "For your budget, I'd set Food & Drink at $280/month (a 20% cut from current), Shopping at $220/month, and Entertainment at $80/month. Those are realistic without feeling like deprivation.",
  "The good news: your financial health score of 74 is above average. The main drag is food delivery frequency — fix that and you could hit 82+ next month.",
]

let demoIdx = 0

export default function AICoach() {
  const navigate = useNavigate()
  const { transactions, isDemoMode, addToast } = useApp()
  const [messages, setMessages] = useState([
    {
      role: 'aria',
      content: "Hi! I'm Aria, your personal financial coach. I've reviewed your spending data and I'm here to help. What's on your mind?",
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const txSummary = transactions.slice(0, 20).map(
    (t) => `$${t.amount} at ${t.merchant_name} (${t.date})`
  ).join(', ')

  const send = async () => {
    const msg = input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: msg }])
    setLoading(true)

    try {
      let advice
      if (isDemoMode) {
        await new Promise((r) => setTimeout(r, 800))
        advice = demoResponses[demoIdx % demoResponses.length]
        demoIdx++
      } else {
        advice = await getAriaAdvice(msg, txSummary)
      }
      setMessages((prev) => [...prev, { role: 'aria', content: advice }])
    } catch {
      addToast('Failed to get advice. Try again.', 'error')
      setMessages((prev) => [...prev, {
        role: 'aria',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
      }])
    }
    setLoading(false)
  }

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: 80 }} className="md:pl-[220px]">
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>

        <div style={{ marginBottom: 20 }}>
          <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px', marginBottom: 12 }} onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, color: 'var(--text-primary)' }}>
            Aria <span style={{ color: 'var(--accent-primary)' }}>✨</span>
          </h1>
          <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Your personal AI financial coach. Warm, specific, and actually helpful.
          </p>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 16 }}>
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: 8,
                }}
              >
                {msg.role === 'aria' && (
                  <span style={{ fontSize: 20, flexShrink: 0 }}>✨</span>
                )}
                <div style={{
                  maxWidth: '75%',
                  background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-surface)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  padding: '12px 16px',
                  fontFamily: 'DM Sans',
                  fontSize: 14,
                  color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                  lineHeight: 1.55,
                }}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <span style={{ fontSize: 20 }}>✨</span>
              <div style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: '18px 18px 18px 4px', padding: '14px 18px',
              }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                      style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask Aria anything about your finances..."
            style={{
              flex: 1, padding: '12px 16px',
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 10, color: 'var(--text-primary)',
              fontFamily: 'DM Sans', fontSize: 14, outline: 'none',
            }}
          />
          <button
            className="btn-accent"
            onClick={send}
            disabled={loading || !input.trim()}
            style={{ padding: '12px 20px', fontSize: 13 }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
