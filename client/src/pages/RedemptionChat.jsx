import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import { getAdvice } from '../api/index.js'

export default function RedemptionChat() {
  const navigate = useNavigate()
  const { villain, transactions } = useApp()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  const txSummary = transactions.length
    ? `Total spent: $${transactions.reduce((s, t) => s + t.amount, 0).toFixed(2)} across ${transactions.length} transactions. Top merchant: ${
        Object.entries(
          transactions.reduce((acc, t) => {
            acc[t.merchant_name] = (acc[t.merchant_name] || 0) + 1
            return acc
          }, {})
        ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown'
      }.`
    : 'No transaction data available.'

  useEffect(() => {
    if (!villain) return
    setMessages([
      {
        role: 'villain',
        text: `${villain.villain_emoji} Oh look, you actually want help. Interesting. ${villain.worst_stat} But fine. What do you want to know?`,
      },
    ])
  }, [villain])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)
    try {
      const advice = await getAdvice(userMsg, txSummary, villain?.villain_type)
      setMessages((prev) => [...prev, { role: 'villain', text: advice }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'villain', text: 'Even I am speechless. Try again.' },
      ])
    }
    setLoading(false)
  }

  if (!villain) {
    navigate('/')
    return null
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--dark)', maxHeight: '100vh' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-4"
        style={{ borderBottom: '0.5px solid rgba(247,242,236,0.08)' }}
      >
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--muted)',
            fontFamily: 'DM Sans',
            fontSize: 14,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          ← Back
        </button>
        <span style={{ fontSize: 24 }}>{villain.villain_emoji}</span>
        <div>
          <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: 'var(--cream)' }}>
            {villain.villain_name}
          </p>
          <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--muted)' }}>
            Redemption Mode
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
        style={{ paddingBottom: 100 }}
      >
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
          >
            {msg.role === 'villain' && (
              <span style={{ fontSize: 20, alignSelf: 'flex-end' }}>{villain.villain_emoji}</span>
            )}
            <div
              style={{
                maxWidth: '75%',
                padding: '12px 16px',
                borderRadius: 12,
                fontFamily: 'DM Sans',
                fontSize: 14,
                lineHeight: 1.5,
                ...(msg.role === 'villain'
                  ? { background: '#1a1816', color: 'var(--cream)', borderBottomLeftRadius: 4 }
                  : { background: '#E8341A', color: 'white', borderBottomRightRadius: 4 }),
              }}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-2 items-center">
            <span style={{ fontSize: 20 }}>{villain.villain_emoji}</span>
            <div
              style={{
                padding: '12px 16px',
                background: '#1a1816',
                borderRadius: 12,
                borderBottomLeftRadius: 4,
              }}
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--muted)',
                      display: 'block',
                    }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 py-4"
        style={{ background: 'var(--dark)', borderTop: '0.5px solid rgba(247,242,236,0.08)' }}
      >
        <div className="flex gap-2 max-w-2xl mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask for financial guidance..."
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 10,
              border: '0.5px solid rgba(247,242,236,0.15)',
              background: '#1a1816',
              color: 'var(--cream)',
              fontFamily: 'DM Sans',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <button
            className="btn-primary"
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{ fontSize: 14, padding: '12px 20px' }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
