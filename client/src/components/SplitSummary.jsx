import { motion } from 'framer-motion'

// Props:
//   splits: [{ person, amount, items, reasoning }]
//   paid: string[]  — names of people who have paid
//   onMarkPaid: (person: string) => void
export default function SplitSummary({ splits, paid, onMarkPaid }) {
  const stillOwed = splits
    .filter((s) => !paid.includes(s.person))
    .reduce((sum, s) => sum + s.amount, 0)

  return (
    <div className="flex flex-col gap-3">
      {splits.map((s, i) => {
        const isPaid = paid.includes(s.person)
        return (
          <motion.div
            key={s.person}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 14px',
              borderRadius: 10,
              background: isPaid ? '#dcfce7' : '#F7F2EC',
              opacity: isPaid ? 0.75 : 1,
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: 'DM Sans',
                  fontWeight: 600,
                  fontSize: 14,
                  color: isPaid ? '#166534' : '#0F0D0C',
                  textDecoration: isPaid ? 'line-through' : 'none',
                }}
              >
                {s.person} {isPaid && '✓'}
              </p>
              {s.items && s.items.length > 0 && (
                <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#8A7F76' }}>
                  {s.items.join(', ')}
                </p>
              )}
              {s.reasoning && (
                <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#8A7F76', fontStyle: 'italic' }}>
                  {s.reasoning}
                </p>
              )}
            </div>

            <div style={{ textAlign: 'right' }}>
              <p
                style={{
                  fontFamily: 'DM Sans',
                  fontWeight: 700,
                  fontSize: 15,
                  color: isPaid ? '#166534' : '#E8341A',
                }}
              >
                ${s.amount.toFixed(2)}
                {isPaid && (
                  <span style={{ fontSize: 11, marginLeft: 4, fontWeight: 400 }}>PAID</span>
                )}
              </p>
              {!isPaid && (
                <button
                  onClick={() => onMarkPaid(s.person)}
                  style={{
                    marginTop: 4,
                    background: '#dcfce7',
                    color: '#166534',
                    border: 'none',
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    cursor: 'pointer',
                    fontFamily: 'DM Sans',
                    fontWeight: 600,
                  }}
                >
                  Mark Paid ✓
                </button>
              )}
            </div>
          </motion.div>
        )
      })}

      {/* Still owed counter */}
      <div
        style={{
          background: stillOwed > 0 ? '#fee2e2' : '#dcfce7',
          borderRadius: 10,
          padding: '10px 14px',
          textAlign: 'center',
        }}
      >
        {stillOwed > 0 ? (
          <p style={{ fontFamily: 'DM Sans', fontWeight: 700, color: '#991b1b', fontSize: 14 }}>
            Still owed: ${stillOwed.toFixed(2)}
          </p>
        ) : (
          <p style={{ fontFamily: 'DM Sans', fontWeight: 700, color: '#166534', fontSize: 14 }}>
            All settled up! 🎉
          </p>
        )}
      </div>
    </div>
  )
}
