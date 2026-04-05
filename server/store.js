// In-memory store — fine for hackathon, single user
let accessToken = null
let gmailTokens = null
let insights = []
let healthScore = null
let subscriptions = []
let budgets = []
let creditCards = []
let lastScanAt = null

export const setAccessToken = (token) => { accessToken = token }
export const getAccessToken = () => accessToken

export const setGmailTokens = (tokens) => { gmailTokens = tokens }
export const getGmailTokens = () => gmailTokens

export const setInsights = (data) => { insights = data }
export const getInsights = () => insights

export const setHealthScore = (data) => { healthScore = data }
export const getHealthScore = () => healthScore

export const setSubscriptions = (data) => { subscriptions = data }
export const getSubscriptions = () => subscriptions
export const updateSubscription = (id, patch) => {
  subscriptions = subscriptions.map((s) => s.id === id ? { ...s, ...patch } : s)
}

export const setBudgets = (data) => { budgets = data }
export const getBudgets = () => budgets

export const setCreditCards = (data) => { creditCards = data }
export const getCreditCards = () => creditCards

export const setLastScanAt = (ts) => { lastScanAt = ts }
export const getLastScanAt = () => lastScanAt
