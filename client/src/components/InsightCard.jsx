import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const typeConfig = {
  warning: { color: 'var(--warning)', icon: '⚠️', bg: 'rgba(245,158,11,0.08)' },
  tip:     { color: 'var(--accent-primary)', icon: '💡', bg: 'rgba(99,102,241,0.08)' },
  win:     { color: 'var(--positive)', icon: '🏆', bg: 'rgba(16,185,129,0.08)' },
  alert:   { color: 'var(--danger)', icon: '🚨', bg: 'rgba(239,68,68,0.08)' },
}

export default function InsightCard({ insight, onDismiss }) {
  const navigate = useNavigate()
  const config = typeConfig[insight.type] || typeConfig.tip

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        background: config.bg,
        border: `1px solid ${config.color}30`,
        borderRadius: 12,
        padding: '16px 18px',
        marginBottom: 12,
        position: 'relative',
      }}
    >
      <button
        onClick={() => onDismiss(insight.id)}
        style={{
          position: 'absolute', top: 10, right: 12,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: 18, lineHeight: 1,
        }}
      >×</button>

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', paddingRight: 20 }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>{config.icon}</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>
            {insight.title}
          </p>
          <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {insight.body}
          </p>
          {insight.action && insight.action_route && (
            <button
              onClick={() => navigate(insight.action_route)}
              style={{
                marginTop: 10,
                background: 'none',
                border: `1px solid ${config.color}`,
                color: config.color,
                fontFamily: 'DM Sans',
                fontSize: 12,
                fontWeight: 600,
                padding: '5px 12px',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              {insight.action} →
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
