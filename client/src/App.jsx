import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext.jsx'
import Landing from './pages/Landing.jsx'
import VillainReveal from './pages/VillainReveal.jsx'
import Dashboard from './pages/Dashboard.jsx'
import RedemptionChat from './pages/RedemptionChat.jsx'
import SplitReceipt from './pages/SplitReceipt.jsx'

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/reveal" element={<VillainReveal />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat" element={<RedemptionChat />} />
          <Route path="/split" element={<SplitReceipt />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
