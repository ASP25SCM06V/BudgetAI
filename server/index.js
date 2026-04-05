import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import plaidRoutes from './routes/plaid.js'
import aiRoutes from './routes/ai.js'
import authRoutes from './routes/auth.js'
import gmailRoutes from './routes/gmail.js'
import splitRoutes from './routes/split.js'
import insightsRoutes from './routes/insights.js'
import subscriptionsRoutes from './routes/subscriptions.js'
import budgetsRoutes from './routes/budgets.js'
import creditCardsRoutes from './routes/credit-cards.js'
import healthScoreRoutes from './routes/health-score.js'
import ariaRoutes from './routes/aria.js'
import { startScheduler } from './scheduler.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json({ limit: '20mb' }))

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use('/api', plaidRoutes)
app.use('/api', aiRoutes)
app.use('/api', authRoutes)
app.use('/api', gmailRoutes)
app.use('/api', splitRoutes)
app.use('/api', insightsRoutes)
app.use('/api', subscriptionsRoutes)
app.use('/api', budgetsRoutes)
app.use('/api', creditCardsRoutes)
app.use('/api', healthScoreRoutes)
app.use('/api', ariaRoutes)

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.message)
  res.status(500).json({ error: err.message })
})

startScheduler()

app.listen(PORT, () => console.log(`BudgetAI server running on :${PORT}`))
