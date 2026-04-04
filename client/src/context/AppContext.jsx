import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [transactions, setTransactions] = useState([])
  const [villain, setVillain] = useState(null)
  const [hp, setHp] = useState(100)
  const [isDemoMode, setIsDemoMode] = useState(false)

  return (
    <AppContext.Provider value={{
      transactions, setTransactions,
      villain, setVillain,
      hp, setHp,
      isDemoMode, setIsDemoMode,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
