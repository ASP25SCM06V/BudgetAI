import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext(null)

function readLS(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}

function writeLS(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export function AppProvider({ children }) {
  // Legacy villain state (kept for backward compat)
  const [transactions, setTransactions] = useState(() => readLS('budgetai_transactions', []))
  const [villain, setVillain] = useState(() => readLS('budgetai_villain', null))
  const [hp, setHp] = useState(() => readLS('budgetai_hp', 100))
  const [isDemoMode, setIsDemoMode] = useState(() => readLS('budgetai_demo', false))

  // BudgetAI v2 state
  const [healthScore, setHealthScore] = useState(() => readLS('budgetai_healthscore', null))
  const [insights, setInsights] = useState(() => readLS('budgetai_insights', []))
  const [subscriptions, setSubscriptions] = useState(() => readLS('budgetai_subscriptions', []))
  const [budgets, setBudgets] = useState(() => readLS('budgetai_budgets', []))
  const [creditCards, setCreditCards] = useState(() => readLS('budgetai_creditcards', []))
  const [creditStrategy, setCreditStrategy] = useState(() => readLS('budgetai_creditstrategy', null))
  const [toasts, setToasts] = useState([])

  // Persist v2 state to localStorage
  useEffect(() => { writeLS('budgetai_transactions', transactions) }, [transactions])
  useEffect(() => { writeLS('budgetai_villain', villain) }, [villain])
  useEffect(() => { writeLS('budgetai_hp', hp) }, [hp])
  useEffect(() => { writeLS('budgetai_demo', isDemoMode) }, [isDemoMode])
  useEffect(() => { writeLS('budgetai_healthscore', healthScore) }, [healthScore])
  useEffect(() => { writeLS('budgetai_insights', insights) }, [insights])
  useEffect(() => { writeLS('budgetai_subscriptions', subscriptions) }, [subscriptions])
  useEffect(() => { writeLS('budgetai_budgets', budgets) }, [budgets])
  useEffect(() => { writeLS('budgetai_creditcards', creditCards) }, [creditCards])
  useEffect(() => { writeLS('budgetai_creditstrategy', creditStrategy) }, [creditStrategy])

  let toastId = 0
  const addToast = (message, type = 'info') => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500)
  }
  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <AppContext.Provider value={{
      // Legacy
      transactions, setTransactions,
      villain, setVillain,
      hp, setHp,
      isDemoMode, setIsDemoMode,
      // v2
      healthScore, setHealthScore,
      insights, setInsights,
      subscriptions, setSubscriptions,
      budgets, setBudgets,
      creditCards, setCreditCards,
      creditStrategy, setCreditStrategy,
      toasts, addToast, removeToast,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
