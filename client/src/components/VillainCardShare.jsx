import { useRef } from 'react'
import html2canvas from 'html2canvas'

export default function VillainCardShare({ villain, onClose }) {
  const cardRef = useRef(null)

  const download = async () => {
    if (!cardRef.current) return
    const canvas = await html2canvas(cardRef.current, { backgroundColor: '#0F0D0C', scale: 2 })
    const link = document.createElement('a')
    link.download = `spendshame-${villain.villain_name.replace(/\s+/g, '-').toLowerCase()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(15,13,12,0.85)' }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-center gap-4">
        <div
          ref={cardRef}
          style={{
            background: 'var(--dark)',
            border: '1px solid rgba(232,52,26,0.4)',
            borderRadius: 16,
            padding: '32px 40px',
            width: 340,
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 64, marginBottom: 8 }}>{villain.villain_emoji}</p>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: 'var(--cream)', marginBottom: 8 }}>
            {villain.villain_name}
          </h2>
          <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
            {villain.worst_stat}
          </p>
          <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 11, color: '#E8341A', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            SpendShame
          </p>
        </div>

        <div className="flex gap-3">
          <button className="btn-primary" onClick={download}>
            Download PNG
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(247,242,236,0.3)',
              color: 'var(--cream)',
              padding: '14px 24px',
              borderRadius: 8,
              fontFamily: 'Syne',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontSize: 14,
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
