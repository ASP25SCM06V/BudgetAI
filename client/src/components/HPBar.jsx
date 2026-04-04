import { motion } from 'framer-motion'

export default function HPBar({ hp, maxHp = 100 }) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100))
  const color = pct > 50 ? '#E8341A' : pct > 25 ? '#ff6b35' : '#ff0000'

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1">
        <span style={{ color: 'var(--muted)', fontFamily: 'DM Sans', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Villain HP
        </span>
        <span style={{ color: '#E8341A', fontFamily: 'Syne', fontWeight: 700, fontSize: 13 }}>
          {hp}/{maxHp}
        </span>
      </div>
      <div className="w-full h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <motion.div
          className="h-3 rounded-full"
          style={{ background: color }}
          initial={{ width: '100%' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
