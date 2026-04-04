import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function SpendChart({ transactions }) {
  const categoryTotals = transactions.reduce((acc, tx) => {
    const cat = tx.category || 'Other'
    acc[cat] = (acc[cat] || 0) + tx.amount
    return acc
  }, {})

  const data = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, total]) => ({ name: name.replace(/_/g, ' '), total: parseFloat(total.toFixed(2)) }))

  return (
    <div className="card w-full">
      <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, color: 'var(--dark)', marginBottom: 16 }}>
        Top Spend Categories
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fontFamily: 'DM Sans', fill: '#8A7F76' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fontFamily: 'DM Sans', fill: '#8A7F76' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value) => [`$${value}`, 'Spent']}
            contentStyle={{ fontFamily: 'DM Sans', fontSize: 13, borderRadius: 8, border: '0.5px solid rgba(15,13,12,0.1)' }}
          />
          <Bar dataKey="total" radius={[4, 4, 0, 0]}>
            {data.map((_, index) => (
              <Cell key={index} fill={index === 0 ? '#E8341A' : '#0F0D0C'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
