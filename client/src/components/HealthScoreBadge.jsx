import { motion } from 'framer-motion'

const gradeColor = {
  A: '#10B981',
  B: '#6366F1',
  C: '#F59E0B',
  D: '#F97316',
  F: '#EF4444',
}

export default function HealthScoreBadge({ healthScore, size = 'md' }) {
  if (!healthScore) return null

  const color = gradeColor[healthScore.grade] || '#6366F1'
  const radius = size === 'lg' ? 54 : 40
  const stroke = size === 'lg' ? 6 : 5
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (healthScore.score / 100) * circumference
  const svgSize = (radius + stroke + 2) * 2

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size === 'lg' ? 24 : 16 }}>
      <div style={{ position: 'relative', width: svgSize, height: svgSize, flexShrink: 0 }}>
        <svg width={svgSize} height={svgSize} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke="var(--bg-elevated)"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              fontFamily: 'Syne', fontWeight: 800,
              fontSize: size === 'lg' ? 28 : 20,
              color: 'var(--text-primary)', lineHeight: 1,
            }}
          >
            {healthScore.score}
          </motion.span>
          <span style={{ fontFamily: 'DM Sans', fontSize: size === 'lg' ? 13 : 10, color: color, fontWeight: 700 }}>
            {healthScore.grade}
          </span>
        </div>
      </div>

      <div>
        <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: size === 'lg' ? 18 : 14, color: 'var(--text-primary)', marginBottom: 4 }}>
          Financial Health Score
        </p>
        {healthScore.summary && (
          <p style={{ fontFamily: 'DM Sans', fontSize: size === 'lg' ? 13 : 12, color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 280 }}>
            {healthScore.summary}
          </p>
        )}
      </div>
    </div>
  )
}
