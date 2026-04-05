import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'

const typeStyles = {
  info:    { bg: '#1a1a2e', border: '#6366F1', icon: 'ℹ️' },
  success: { bg: '#052e16', border: '#10B981', icon: '✅' },
  warning: { bg: '#2d1f00', border: '#F59E0B', icon: '⚠️' },
  error:   { bg: '#2d0a0a', border: '#EF4444', icon: '❌' },
}

export default function Toast() {
  const { toasts, removeToast } = useApp()

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <AnimatePresence>
        {toasts.map((toast) => {
          const style = typeStyles[toast.type] || typeStyles.info
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              onClick={() => removeToast(toast.id)}
              style={{
                background: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: 10,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                minWidth: 280,
                maxWidth: 380,
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
            >
              <span style={{ fontSize: 16 }}>{style.icon}</span>
              <span style={{ fontFamily: 'DM Sans', fontSize: 14, color: 'var(--text-primary)', flex: 1 }}>
                {toast.message}
              </span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
