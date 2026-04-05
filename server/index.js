import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import plaidRoutes from './routes/plaid.js'
import aiRoutes from './routes/ai.js'
import authRoutes from './routes/auth.js'
import gmailRoutes from './routes/gmail.js'
import splitRoutes from './routes/split.js'

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

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.message)
  res.status(500).json({ error: err.message })
})

app.listen(PORT, () => console.log(`SpendShame server running on :${PORT}`))
