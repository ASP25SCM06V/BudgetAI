import { google } from 'googleapis'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

// 7 financial email categories searched in parallel
const GMAIL_QUERIES = [
  'subject:(order OR receipt OR confirmation OR purchase) category:primary',
  'subject:(transaction OR charged OR "credit card" OR statement) category:primary',
  'subject:(subscription OR renewal OR billing OR plan) category:primary',
  'subject:(autopay OR "automatic payment" OR "auto-pay") category:primary',
  'subject:(insurance OR premium OR "policy payment") category:primary',
  'subject:(pending OR "payment due" OR invoice) category:primary',
  'subject:(receipt OR paid OR "payment confirmation") category:primary',
]

function buildOAuth2Client(tokens) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback'
  )
  oauth2Client.setCredentials(tokens)
  return oauth2Client
}

async function searchEmails(gmail, query) {
  try {
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 15,
    })
    return res.data.messages || []
  } catch {
    return []
  }
}

function extractTextFromPayload(payload) {
  if (!payload) return ''
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8')
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8')
      }
      const nested = extractTextFromPayload(part)
      if (nested) return nested
    }
  }
  return ''
}

async function getEmailContent(gmail, messageId) {
  const res = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  })
  const headers = res.data.payload?.headers || []
  const subject = headers.find(h => h.name === 'Subject')?.value || ''
  const body = extractTextFromPayload(res.data.payload)
  return { subject, body }
}

async function extractTransaction(subject, body) {
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      system: 'Extract financial transaction data from this email. Return ONLY valid JSON with no markdown: { "merchant_name": string, "amount": number, "date": string, "category": string }. If no clear transaction found, return the exact string null.',
      messages: [{
        role: 'user',
        content: `Subject: ${subject}\n\n${body.substring(0, 1500)}`,
      }],
    })
    const raw = message.content[0].text.trim()
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
    if (raw === 'null' || raw === '') return null
    const parsed = JSON.parse(raw)
    if (!parsed.merchant_name || !parsed.amount) return null
    return parsed
  } catch {
    return null
  }
}

export async function fetchGmailTransactions(tokens) {
  const auth = buildOAuth2Client(tokens)
  const gmail = google.gmail({ version: 'v1', auth })

  // Query all 7 categories in parallel
  const messageArrays = await Promise.all(
    GMAIL_QUERIES.map(q => searchEmails(gmail, q))
  )

  // Deduplicate by message ID
  const seen = new Set()
  const allMessages = []
  for (const msgs of messageArrays) {
    for (const msg of msgs) {
      if (!seen.has(msg.id)) {
        seen.add(msg.id)
        allMessages.push(msg)
      }
    }
  }

  // Cap at 40 emails to keep latency reasonable
  const limited = allMessages.slice(0, 40)

  const results = await Promise.all(
    limited.map(async (msg) => {
      try {
        const { subject, body } = await getEmailContent(gmail, msg.id)
        return await extractTransaction(subject, body)
      } catch {
        return null
      }
    })
  )

  return results.filter(Boolean)
}
