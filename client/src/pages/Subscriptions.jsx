import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import { updateSubscriptionStatus } from '../api/index.js'

const statusConfig = {
  active:    { label: 'Active',    color: 'var(--positive)',        bg: 'rgba(16,185,129,0.1)' },
  unused:    { label: 'Unused',    color: 'var(--danger)',          bg: 'rgba(239,68,68,0.1)' },
  cancelled: { label: 'Cancelled', color: 'var(--text-muted)',      bg: 'rgba(107,114,128,0.1)' },
  keep:      { label: 'Keeping',   color: 'var(--accent-primary)',  bg: 'rgba(99,102,241,0.1)' },
}

export default function Subscriptions() {
  const navigate = useNavigate()
  const { subscriptions, setSubscriptions, isDemoMode, addToast } = useApp()

  const totalMonthly = subscriptions
    .filter((s) => s.status !== 'cancelled')
    .reduce((sum, s) => sum + s.amount, 0)

  const cancelledSavings = subscriptions
    .filter((s) => s.status === 'cancelled')
    .reduce((sum, s) => sum + s.amount, 0)

  const handleStatusChange = async (id, newStatus) => {
    const updated = subscriptions.map((s) => s.id === id ? { ...s, status: newStatus } : s)
    setSubscriptions(updated)

    if (!isDemoMode) {
      try {
        await updateSubscriptionStatus(id, newStatus)
      } catch {
        addToast('Failed to update — saved locally', 'warning')
      }
    }

    if (newStatus === 'cancelled') {
      const sub = subscriptions.find((s) => s.id === id)
      addToast(`${sub?.name} marked as cancelled — saving $${sub?.amount}/mo`, 'success')
    }
  }

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: 80 }} className="md:pl-[220px]">
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 20px' }}>

        <button className="btn-ghost" style={{ fontSize: 12, padding: '6px 12px', marginBottom: 20 }} onClick={() => navigate('/dashboard')}>
          ← Back
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 26, color: 'var(--text-primary)' }}>
              Subscription Radar
            </h1>
            <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              AI-detected recurring charges from your transactions.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: 'var(--text-primary)' }}>
              ${totalMonthly.toFixed(2)}
              <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'DM Sans' }}>/mo</span>
            </p>
            {cancelledSavings > 0 && (
              <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--positive)', marginTop: 2 }}>
                Saving ${(cancelledSavings * 12).toFixed(0)}/yr so far
              </p>
            )}
          </div>
        </div>

        {subscriptions.length === 0 ? (
          <div className="surface" style={{ textAlign: 'center', padding: 48 }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>🔄</p>
            <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 8 }}>
              No subscriptions detected
            </p>
            <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--text-secondary)' }}>
              Connect your bank account and Aria will find your recurring charges.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <AnimatePresence>
              {subscriptions.map((sub, i) => {
                const cfg = statusConfig[sub.status] || statusConfig.active
                return (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="surface"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
                            {sub.name}
                          </p>
                          <span style={{
                            background: cfg.bg, color: cfg.color,
                            fontFamily: 'DM Sans', fontSize: 10, fontWeight: 700,
                            padding: '2px 8px', borderRadius: 99, letterSpacing: '0.05em',
                          }}>{cfg.label}</span>
                        </div>
                        <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--text-muted)' }}>
                          {sub.usage_signal}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: sub.status === 'unused' ? 'var(--danger)' : 'var(--text-primary)' }}>
                            ${sub.amount}
                          </p>
                          <p style={{ fontFamily: 'DM Sans', fontSize: 10, color: 'var(--text-muted)' }}>
                            {sub.frequency} · ${(sub.amount * 12).toFixed(0)}/yr
                          </p>
                        </div>

                        {sub.status !== 'cancelled' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => handleStatusChange(sub.id, 'keep')}
                              style={{
                                background: sub.status === 'keep' ? 'rgba(99,102,241,0.2)' : 'transparent',
                                border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)',
                                fontFamily: 'DM Sans', fontSize: 12, fontWeight: 600,
                                padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                              }}
                            >
                              Keep
                            </button>
                            <button
                              onClick={() => handleStatusChange(sub.id, 'cancelled')}
                              style={{
                                background: 'transparent',
                                border: '1px solid var(--danger)', color: 'var(--danger)',
                                fontFamily: 'DM Sans', fontSize: 12, fontWeight: 600,
                                padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {sub.status === 'cancelled' && (
                          <button
                            onClick={() => handleStatusChange(sub.id, 'active')}
                            style={{
                              background: 'transparent', border: '1px solid var(--border)',
                              color: 'var(--text-muted)', fontFamily: 'DM Sans', fontSize: 12,
                              padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                            }}
                          >
                            Undo
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
