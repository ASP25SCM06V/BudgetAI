import { motion } from 'framer-motion'

export default function BudgetBar({ budget }) {
  const { category, limit, spent, icon } = budget
  const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
  const over = spent > limit
  const color = over ? 'var(--danger)' : pct > 80 ? 'var(--warning)' : 'var(--accent-primary)'

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>{icon}</span>
          <span style={{ fontFamily: 'DM Sans', fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>
            {category}
          </span>
          {over && (
            <span style={{
              background: 'rgba(239,68,68,0.15)', color: 'var(--danger)',
              fontFamily: 'DM Sans', fontSize: 10, fontWeight: 700,
              padding: '2px 7px', borderRadius: 99, letterSpacing: '0.05em',
            }}>OVER</span>
          )}
        </div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: over ? 'var(--danger)' : 'var(--text-secondary)' }}>
          ${spent.toFixed(0)} / ${limit.toFixed(0)}
        </span>
      </div>

      <div style={{ background: 'var(--bg-elevated)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: 99 }}
        />
      </div>
    </div>
  )
}
