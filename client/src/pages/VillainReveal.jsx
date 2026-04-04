import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import HPBar from '../components/HPBar.jsx'
import VillainCardShare from '../components/VillainCardShare.jsx'

export default function VillainReveal() {
  const navigate = useNavigate()
  const { villain, hp } = useApp()
  const [showShare, setShowShare] = useState(false)

  if (!villain) {
    navigate('/')
    return null
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'var(--dark)' }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg flex flex-col items-center gap-8"
      >
        {/* Villain emoji dramatic entrance */}
        <motion.p
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          style={{ fontSize: 96 }}
        >
          {villain.villain_emoji}
        </motion.p>

        {/* Villain card slides up */}
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="card w-full"
        >
          <div className="flex flex-col gap-4">
            <div>
              <p
                style={{
                  fontFamily: 'DM Sans',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--muted)',
                  marginBottom: 4,
                }}
              >
                Your Villain
              </p>
              <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: 'var(--dark)' }}>
                {villain.villain_name}
              </h2>
            </div>

            <p style={{ fontFamily: 'DM Sans', fontSize: 14, color: '#3a3632', lineHeight: 1.6 }}>
              {villain.villain_description}
            </p>

            <HPBar hp={hp} />

            <div className="flex flex-col gap-2 mt-1">
              <p
                style={{
                  fontFamily: 'DM Sans',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--muted)',
                }}
              >
                Signature Taunts
              </p>
              {villain.signature_taunts.map((taunt, i) => (
                <motion.div
                  key={i}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.7 + i * 0.15 }}
                  className="villain-bubble"
                >
                  <span style={{ marginRight: 8 }}>💀</span>
                  {taunt}
                </motion.div>
              ))}
            </div>

            <div
              style={{
                marginTop: 4,
                padding: '12px 14px',
                borderRadius: 8,
                background: 'rgba(232,52,26,0.06)',
                border: '0.5px solid rgba(232,52,26,0.2)',
              }}
            >
              <p style={{ fontFamily: 'DM Sans', fontSize: 13, fontWeight: 500, color: '#E8341A' }}>
                ⚠️ {villain.worst_stat}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex flex-col gap-3 w-full"
        >
          <button className="btn-primary" onClick={() => navigate('/dashboard')}>
            Enter the Shame Dashboard →
          </button>
          <button
            onClick={() => setShowShare(true)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(247,242,236,0.2)',
              color: 'var(--cream)',
              fontFamily: 'Syne',
              fontWeight: 700,
              fontSize: 13,
              padding: '12px 24px',
              borderRadius: 8,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Share My Villain Card
          </button>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showShare && (
          <VillainCardShare villain={villain} onClose={() => setShowShare(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
