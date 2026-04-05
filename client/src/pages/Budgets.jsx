import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import BudgetBar from '../components/BudgetBar.jsx'
import { saveBudgets } from '../api/index.js'

const defaultCategories = [
  { category: 'Food & Drink',  icon: '🍔', limit: 300, spent: 0 },
  { category: 'Shopping',      icon: '🛍️', limit: 200, spent: 0 },
  { category: 'Entertainment', icon: '🎬', limit: 80,  spent: 0 },
  { category: 'Transport',     icon: '🚗', limit: 150, spent: 0 },
  { category: 'Software',      icon: '💻', limit: 50,  spent: 0 },
]

export default function Budgets() {
  const navigate = useNavigate()
  const { budgets, setBudgets, transactions, isDemoMode, addToast } = useApp()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)

  const startEdit = () => {
    const base = budgets.length > 0 ? budgets : defaultCategories.map((b, i) => {
      const categoryTx = transactions.filter((t) =>
        (t.category || '').toLowerCase().includes(b.category.split(' ')[0].toLowerCase())
      )
      const spent = categoryTx.reduce((sum, t) => sum + t.amount, 0)
      return { ...b, id: `bud_${i}`, spent: parseFloat(spent.toFixed(2)) }
    })
    setDraft(base.map((b) => ({ ...b })))
    setEditing(true)
  }

  const save = async () => {
    setSaving(true)
    try {
      if (!isDemoMode) {
        const saved = await saveBudgets(draft)
        setBudgets(saved)
      } else {
        setBudgets(draft)
      }
      addToast('Budgets saved!', 'success')
      setEditing(false)
    } catch {
      addToast('Failed to save budgets', 'error')
    }
    setSaving(false)
  }

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: 80 }} className="md:pl-[220px]">
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px' }}>

        <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px', marginBottom: 20 }} onClick={() => navigate('/dashboard')}>
          ← Back
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 26, color: 'var(--text-primary)' }}>
              Budgets
            </h1>
            <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Set monthly limits and track spending by category.
            </p>
          </div>
          {!editing && (
            <button className="btn-accent" onClick={startEdit} style={{ fontSize: 13, padding: '10px 20px' }}>
              {budgets.length > 0 ? 'Edit Budgets' : 'Set Budgets'}
            </button>
          )}
        </div>

        {/* View mode */}
        {!editing && (
          <>
            {budgets.length === 0 ? (
              <div className="surface" style={{ textAlign: 'center', padding: 48 }}>
                <p style={{ fontSize: 40, marginBottom: 16 }}>🎯</p>
                <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 8 }}>
                  No budgets yet
                </p>
                <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                  Set monthly limits to track your spending.
                </p>
                <button className="btn-accent" onClick={startEdit}>Set Your Budgets</button>
              </div>
            ) : (
              <div className="surface">
                {budgets.map((b) => <BudgetBar key={b.id} budget={b} />)}
              </div>
            )}
          </>
        )}

        {/* Edit mode */}
        {editing && draft && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {draft.map((b, i) => (
                <div key={b.id} className="surface" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{b.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'DM Sans', fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>
                      {b.category}
                    </p>
                    <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--text-muted)' }}>
                      Current spend: ${b.spent.toFixed(0)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--text-muted)' }}>$</span>
                    <input
                      type="number"
                      value={b.limit}
                      min={0}
                      onChange={(e) => {
                        const updated = [...draft]
                        updated[i] = { ...updated[i], limit: parseFloat(e.target.value) || 0 }
                        setDraft(updated)
                      }}
                      style={{
                        width: 80, padding: '8px 10px',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                        borderRadius: 8, color: 'var(--text-primary)',
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 14, outline: 'none', textAlign: 'right',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-accent" onClick={save} disabled={saving} style={{ fontSize: 13, padding: '10px 24px' }}>
                {saving ? 'Saving...' : 'Save Budgets'}
              </button>
              <button className="btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
