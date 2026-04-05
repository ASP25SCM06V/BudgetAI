import Anthropic from '@anthropic-ai/sdk'
import { randomUUID } from 'crypto'

const client = new Anthropic()

// In-memory store for splits — keyed by UUID
const splits = new Map()

export async function extractReceiptData(base64Image, mediaType = 'image/jpeg') {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64Image,
          },
        },
        {
          type: 'text',
          text: 'You are a receipt parser. Extract all line items and totals from this receipt image. Return ONLY valid JSON with no markdown: { "items": [{"name": string, "price": number}], "subtotal": number, "tax": number, "total": number }. If a field is not visible, use null.',
        },
      ],
    }],
  })

  const raw = message.content[0].text.trim()
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')
  return JSON.parse(raw)
}

export async function calculateSplit(items, people, mode) {
  if (mode === 'equal') {
    const total = items.reduce((sum, i) => sum + (i.price || 0), 0)
    const base = Math.floor((total / people.length) * 100) / 100
    const remainder = Math.round((total - base * (people.length - 1)) * 100) / 100
    return people.map((person, idx) => ({
      person,
      amount: idx === people.length - 1 ? Math.round(remainder * 100) / 100 : base,
      items: [],
      reasoning: '',
    }))
  }

  if (mode === 'by_item') {
    const unassignedItems = items.filter(i => !i.assignedTo)
    const unassignedTotal = unassignedItems.reduce((s, i) => s + (i.price || 0), 0)
    const sharedPerPerson = people.length > 0 ? unassignedTotal / people.length : 0

    return people.map(person => {
      const personItems = items.filter(i => i.assignedTo === person)
      const personOwed = personItems.reduce((s, i) => s + (i.price || 0), 0) + sharedPerPerson
      return {
        person,
        amount: Math.round(personOwed * 100) / 100,
        items: personItems.map(i => i.name),
        reasoning: '',
      }
    })
  }

  if (mode === 'ai') {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Suggest a fair split of this bill among these people based on the items. Items: ${JSON.stringify(items)}. People: ${JSON.stringify(people)}. Return ONLY valid JSON with no markdown: { "splits": [{"person": string, "amount": number, "reasoning": string}] }. Keep reasoning to one short phrase. Amounts must sum to the total.`,
      }],
    })
    const raw = message.content[0].text.trim()
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
    const data = JSON.parse(raw)
    return data.splits
  }

  throw new Error(`Unknown split mode: ${mode}`)
}

export function saveSplit(splitData) {
  const id = randomUUID()
  const record = {
    ...splitData,
    id,
    paid: [],
    createdAt: new Date().toISOString(),
  }
  splits.set(id, record)
  return id
}

export function getSplit(id) {
  return splits.get(id) || null
}

export function markPersonPaid(id, person) {
  const split = splits.get(id)
  if (!split) return null
  if (!split.paid.includes(person)) {
    split.paid.push(person)
  }
  splits.set(id, split)
  return split
}
