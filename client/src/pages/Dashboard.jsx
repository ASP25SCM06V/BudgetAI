import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext.jsx'
import HealthScoreBadge from '../components/HealthScoreBadge.jsx'
import BudgetBar from '../components/BudgetBar.jsx'
import InsightCard from '../components/InsightCard.jsx'
import SkeletonCard from '../components/SkeletonCard.jsx'
import SpendChart from '../components/SpendChart.jsx'

export default function Dashboard() {
  const navigate = useNavigate()
  const {
    transactions, healthScore, insights, setInsights,
    subscriptions, budgets, creditCards, creditStrategy,
    isDemoMode, addToast,
  } = useApp()

  useEffect(() => {
    if (!transactions.length && !isDemoMode) {
      navigate('/')
    }
  }, [transactions, isDemoMode, navigate])

  const unusedSubs = subscriptions.filter((s) => s.status === 'unused')
  const overBudgets = budgets.filter((b) => b.spent > b.limit)
  const totalSpend = transactions.reduce((sum, t) => sum + (t.amount || 0), 0)
  const totalSubCost = subscriptions
    .filter((s) => s.status !== 'cancelled')
    .reduce((sum, s) => sum + s.amount, 0)

  const dismissInsight = (id) => {
    setInsights((prev) => prev.filter((i) => i.id !== id))
    addToast('Insight dismissed', 'info')
  }

  const statCards = [
    {
      label: 'Total Spend (90d)',
      value: `$${totalSpend.toFixed(0)}`,
      icon: '💸',
      color: 'var(--danger)',
      sub: `${transactions.length} transactions`,
      action: null,
    },
    {
      label: 'Monthly Subscriptions',
      value: `$${totalSubCost.toFixed(0)}/mo`,
      icon: '🔄',
      color: 'var(--warning)',
      sub: unusedSubs.length > 0 ? `${unusedSubs.length} unused` : 'All active',
      action: unusedSubs.length > 0 ? () => navigate('/subscriptions') : null,
    },
    {
      label: 'Budgets On Track',
      value: `${budgets.length - overBudgets.length}/${budgets.length || '—'}`,
      icon: '🎯',
      color: overBudgets.length > 0 ? 'var(--warning)' : 'var(--positive)',
      sub: overBudgets.length > 0 ? `${overBudgets.length} over budget` : 'Great work!',
      action: overBudgets.length > 0 ? () => navigate('/budgets') : null,
    },
    {
      label: 'Credit Cards',
      value: creditCards.length > 0 ? `${creditCards.length} cards` : '—',
      icon: '💳',
      color: 'var(--accent-primary)',
      sub: creditStrategy ? `${creditStrategy.strategy} recommended` : 'Add your cards',
      action: () => navigate('/credit-cards'),
    },
  ]

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', paddingBottom: 80 }}>
      <div className="md:pl-[220px]">
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px' }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 28, color: 'var(--text-primary)' }}>
              Dashboard
            </h1>
            {isDemoMode && (
              <span style={{
                display: 'inline-block', marginTop: 6,
                background: 'rgba(99,102,241,0.15)', color: 'var(--accent-primary)',
                fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700,
                padding: '3px 10px', borderRadius: 99, letterSpacing: '0.05em',
              }}>DEMO MODE</span>
            )}
          </div>

          {/* Health Score */}
          <div className="surface" style={{ marginBottom: 20 }}>
            {healthScore ? (
              <HealthScoreBadge healthScore={healthScore} size="lg" />
            ) : (
              <SkeletonCard height={90} />
            )}
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 20 }}>
            {statCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="surface"
                onClick={card.action || undefined}
                style={{ cursor: card.action ? 'pointer' : 'default' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{card.icon}</span>
                  {card.action && (
                    <span style={{ fontSize: 11, color: 'var(--accent-primary)', fontFamily: 'DM Sans' }}>View →</span>
                  )}
                </div>
                <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  {card.label}
                </p>
                <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: card.color }}>
                  {card.value}
                </p>
                <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  {card.sub}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Insights + Budgets */}
          <div style={{ display: 'grid', gap: 16, marginBottom: 20 }} className="md:grid-cols-2">

            {/* Insights */}
            <div>
              <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 12 }}>
                Aria's Insights
              </h2>
              {insights.length === 0 && (
                <div className="surface" style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans', fontSize: 13, textAlign: 'center', padding: 24 }}>
                  {isDemoMode ? 'No insights to show.' : 'Connect your bank to get AI insights.'}
                </div>
              )}
              <AnimatePresence>
                {insights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} onDismiss={dismissInsight} />
                ))}
              </AnimatePresence>
            </div>

            {/* Budget Bars */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                  Budgets
                </h2>
                <button
                  onClick={() => navigate('/budgets')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontFamily: 'DM Sans', fontSize: 12, cursor: 'pointer' }}
                >
                  Manage →
                </button>
              </div>
              <div className="surface">
                {budgets.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontFamily: 'DM Sans', fontSize: 13, textAlign: 'center', padding: '8px 0' }}>
                    No budgets set.{' '}
                    <span style={{ color: 'var(--accent-primary)', cursor: 'pointer' }} onClick={() => navigate('/budgets')}>
                      Set one →
                    </span>
                  </p>
                ) : (
                  budgets.map((b) => <BudgetBar key={b.id} budget={b} />)
                )}
              </div>
            </div>
          </div>

          {/* Spend chart */}
          {transactions.length > 0 && (
            <div className="surface" style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 16 }}>
                Spending by Category
              </h2>
              <SpendChart transactions={transactions} />
            </div>
          )}

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn-accent" onClick={() => navigate('/coach')}>Ask Aria ✨</button>
            <button className="btn-ghost" onClick={() => navigate('/split')}>Split a Receipt 🧾</button>
            <button className="btn-ghost" onClick={() => navigate('/subscriptions')}>Subscription Radar 🔄</button>
          </div>

        </div>
      </div>
    </div>
  )
}
