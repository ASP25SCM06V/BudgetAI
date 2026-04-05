import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-sonnet-4-20250514'

export async function analyzeTransactions(transactions) {
  const txJson = JSON.stringify(transactions.slice(0, 60))

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system:
      "You are SpendShame's villain assignment engine. Analyze the user's real bank transactions and return ONLY valid JSON with no markdown, no code fences, no explanation.",
    messages: [
      {
        role: 'user',
        content: `Here are the user's last 90 days of transactions: ${txJson}

Based on dominant spending patterns, assign one villain archetype from these 4:
- "impulse_king": high variance purchases, late-night shopping, many small merchants
- "subscription_hoarder": many recurring charges, streaming services, SaaS tools
- "yolo_investor": large irregular transfers, investment apps, crypto exchanges
- "latte_phantom": high food/coffee frequency, delivery apps, cafe merchants

Return EXACTLY this JSON structure (no markdown):
{
  "villain_type": "impulse_king|subscription_hoarder|yolo_investor|latte_phantom",
  "villain_name": "a darkly funny villain name",
  "villain_emoji": "one emoji",
  "villain_description": "2 sentences, darkly funny, referencing their actual habits",
  "signature_taunts": ["taunt 1 referencing actual merchant names and amounts", "taunt 2", "taunt 3"],
  "worst_stat": "one shocking sentence about their worst habit using real numbers from the data",
  "hp": 100
}`,
      },
    ],
  })

  const raw = message.content[0].text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  return JSON.parse(raw)
}

export async function roastTransaction(transaction, villainType) {
  const villainVoices = {
    impulse_king: 'arrogant royalty who mocks impulsive spending',
    subscription_hoarder: 'obsessive collector who hoards digital subscriptions',
    yolo_investor: 'reckless gambler who laughs at financial risk',
    latte_phantom: 'ghostly coffee addict haunting every cafe',
  }
  const voice = villainVoices[villainType] || 'financial villain'

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 150,
    system: `You are a ${voice}. Give one short, savage roast (1-2 sentences max) about this transaction. Be darkly funny, specific to the merchant. No emojis at start. No markdown.`,
    messages: [
      {
        role: 'user',
        content: `Transaction: $${transaction.amount} at ${transaction.merchant_name} on ${transaction.date}`,
      },
    ],
  })

  return message.content[0].text.trim()
}


export async function getVillainAdvice(userMessage, txSummary, villainType) {
  const villainVoices = {
    impulse_king: 'The Impulse King — an arrogant financial overlord who reluctantly gives real advice wrapped in mockery',
    subscription_hoarder: 'The Subscription Hoarder — a passive-aggressive digital hoarder who gives advice through disappointment',
    yolo_investor: 'The YOLO Investor — a chaotic gambler who gives surprisingly real advice between reckless suggestions',
    latte_phantom: 'The Latte Phantom — a ghostly caffeine spirit who haunts bad financial decisions with passive-aggressive wisdom',
  }
  const voice = villainVoices[villainType] || 'a sarcastic financial villain'

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: `You are ${voice}. Give financial advice that is darkly funny but actually useful. Reference real numbers from the transaction summary. Keep responses under 4 sentences. No markdown.`,
    messages: [
      {
        role: 'user',
        content: `Transaction summary: ${txSummary}\n\nUser asks: ${userMessage}`,
      },
    ],
  })

  return message.content[0].text.trim()
}

// ── BudgetAI v2 — Aria persona functions ──────────────────────────────────────

export async function computeHealthScore(transactions) {
  const txJson = JSON.stringify(transactions.slice(0, 60))

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: 'You are Aria, a warm and empowering financial coach. Analyze transactions and return ONLY valid JSON with no markdown, no code fences, no explanation.',
    messages: [{
      role: 'user',
      content: `Analyze these transactions and compute a financial health score: ${txJson}

Return EXACTLY this JSON (no markdown):
{
  "score": <number 0-100>,
  "grade": "A|B|C|D|F",
  "summary": "2 sentences — warm, specific, encouraging",
  "categories": {
    "spending_control": <0-100>,
    "subscription_efficiency": <0-100>,
    "savings_rate": <0-100>,
    "diversity": <0-100>
  },
  "top_insight": "one actionable sentence Aria would say"
}`
    }]
  })

  const raw = message.content[0].text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  return JSON.parse(raw)
}

export async function detectSubscriptions(transactions) {
  const txJson = JSON.stringify(transactions.slice(0, 100))

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: 'You are Aria, a financial coach. Analyze transactions and return ONLY valid JSON with no markdown.',
    messages: [{
      role: 'user',
      content: `Find recurring subscription charges in these transactions: ${txJson}

Return EXACTLY this JSON (no markdown):
{
  "subscriptions": [
    {
      "id": "sub_1",
      "name": "Service name",
      "amount": 9.99,
      "frequency": "monthly",
      "category": "Entertainment",
      "last_charged": "YYYY-MM-DD",
      "status": "active|unused",
      "usage_signal": "brief explanation of usage or lack thereof"
    }
  ]
}`
    }]
  })

  const raw = message.content[0].text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  return JSON.parse(raw).subscriptions || []
}

export async function generateInsights(transactions, healthScore) {
  const txJson = JSON.stringify(transactions.slice(0, 40))

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: 'You are Aria, a warm and empowering financial coach. Return ONLY valid JSON with no markdown.',
    messages: [{
      role: 'user',
      content: `Based on these transactions and health score ${healthScore?.score || 'unknown'}, generate 4 financial insight cards: ${txJson}

Return EXACTLY this JSON (no markdown):
{
  "insights": [
    {
      "id": "ins_1",
      "type": "warning|tip|win|alert",
      "title": "short title",
      "body": "2-3 sentences, warm and specific, reference real merchants/amounts",
      "action": "optional CTA text or null",
      "action_route": "/subscriptions|/budgets|/credit-cards|/coach|null"
    }
  ]
}`
    }]
  })

  const raw = message.content[0].text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  return JSON.parse(raw).insights || []
}

export async function analyzeCreditCards(cards) {
  const cardsJson = JSON.stringify(cards)

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: 'You are Aria, a financial coach. Return ONLY valid JSON with no markdown.',
    messages: [{
      role: 'user',
      content: `Analyze these credit cards and build a payoff strategy: ${cardsJson}

Return EXACTLY this JSON (no markdown):
{
  "strategy": "avalanche|snowball",
  "strategy_reason": "2 sentences explaining why this strategy was chosen",
  "estimated_savings": <dollar amount saved in interest>,
  "payoff_order": ["card name 1", "card name 2"],
  "aria_recommendation": "1 sentence Aria would say, warm and specific"
}`
    }]
  })

  const raw = message.content[0].text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  return JSON.parse(raw)
}

export async function getAriaAdvice(userMessage, txSummary) {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    system: 'You are Aria, a warm and empowering AI financial coach. Give specific, actionable advice based on real numbers. Keep responses under 4 sentences. Never shame or mock. No markdown.',
    messages: [{
      role: 'user',
      content: `Transaction summary: ${txSummary}\n\nUser asks: ${userMessage}`
    }]
  })

  return message.content[0].text.trim()
}
