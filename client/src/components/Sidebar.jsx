import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

const navItems = [
  { to: '/dashboard',     label: 'Dashboard',     icon: '📊' },
  { to: '/coach',         label: 'Aria Coach',    icon: '✨' },
  { to: '/subscriptions', label: 'Subscriptions', icon: '🔄' },
  { to: '/budgets',       label: 'Budgets',       icon: '🎯' },
  { to: '/credit-cards',  label: 'Credit Cards',  icon: '💳' },
  { to: '/split',         label: 'Split Receipt', icon: '🧾' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { healthScore } = useApp()

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex"
        style={{
          width: 220,
          background: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          flexDirection: 'column',
          zIndex: 100,
        }}
      >
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <h1
            style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: 'var(--text-primary)', cursor: 'pointer' }}
            onClick={() => navigate('/dashboard')}
          >
            Budget<span style={{ color: 'var(--accent-primary)' }}>AI</span>
          </h1>
          {healthScore && (
            <p style={{ fontFamily: 'DM Sans', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Score: <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{healthScore.score}</span>
              <span style={{ marginLeft: 4 }}>({healthScore.grade})</span>
            </p>
          )}
        </div>

        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                marginBottom: 4,
                textDecoration: 'none',
                background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontFamily: 'DM Sans',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
              })}
            >
              <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontFamily: 'DM Sans', fontSize: 10, color: 'var(--text-muted)' }}>
            Your money, understood.
          </p>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav
        className="flex md:hidden"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--bg-surface)',
          borderTop: '1px solid var(--border)',
          justifyContent: 'space-around',
          padding: '8px 0 12px',
          zIndex: 100,
        }}
      >
        {navItems.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              textDecoration: 'none',
              color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
              fontSize: 9,
              fontFamily: 'DM Sans',
              fontWeight: isActive ? 600 : 400,
            })}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            {item.label.split(' ')[0]}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
