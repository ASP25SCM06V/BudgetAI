import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import Toast from './components/Toast.jsx'
import Landing from './pages/Landing.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AICoach from './pages/AICoach.jsx'
import Subscriptions from './pages/Subscriptions.jsx'
import Budgets from './pages/Budgets.jsx'
import CreditCards from './pages/CreditCards.jsx'
import SplitReceipt from './pages/SplitReceipt.jsx'

function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing — no sidebar */}
          <Route path="/" element={<Landing />} />

          {/* App pages — with sidebar */}
          <Route path="/dashboard" element={
            <AppLayout><Dashboard /></AppLayout>
          } />
          <Route path="/coach" element={
            <AppLayout><AICoach /></AppLayout>
          } />
          <Route path="/subscriptions" element={
            <AppLayout><Subscriptions /></AppLayout>
          } />
          <Route path="/budgets" element={
            <AppLayout><Budgets /></AppLayout>
          } />
          <Route path="/credit-cards" element={
            <AppLayout><CreditCards /></AppLayout>
          } />
          <Route path="/split" element={
            <AppLayout><SplitReceipt /></AppLayout>
          } />
        </Routes>
        <Toast />
      </BrowserRouter>
    </AppProvider>
  )
}
