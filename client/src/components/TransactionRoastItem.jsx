export default function TransactionRoastItem({ transaction, taunt }) {
  return (
    <div
      className="flex flex-col gap-1 py-3"
      style={{ borderBottom: '0.5px solid rgba(247,242,236,0.08)' }}
    >
      <div className="flex justify-between items-center">
        <span style={{ color: 'var(--cream)', fontFamily: 'DM Sans', fontWeight: 500, fontSize: 14 }}>
          {transaction.merchant_name}
        </span>
        <span style={{ color: '#E8341A', fontFamily: 'Syne', fontWeight: 700, fontSize: 14 }}>
          ${transaction.amount.toFixed(2)}
        </span>
      </div>
      <p style={{ color: 'var(--muted)', fontFamily: 'DM Sans', fontSize: 12 }}>
        {transaction.date}
      </p>
      {taunt && (
        <p style={{ color: 'rgba(247,242,236,0.6)', fontFamily: 'DM Sans', fontSize: 13, fontStyle: 'italic', marginTop: 4 }}>
          💀 "{taunt}"
        </p>
      )}
    </div>
  )
}
