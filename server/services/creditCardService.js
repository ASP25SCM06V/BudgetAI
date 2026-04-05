import { analyzeCreditCards } from './claudeService.js'
import { getCreditCards, setCreditCards } from '../store.js'

export async function runCreditCardAnalysis(cards) {
  if (!cards || cards.length === 0) return { cards: getCreditCards(), strategy: null }

  try {
    const analysis = await analyzeCreditCards(cards)
    const enriched = cards.map((card, i) => ({
      ...card,
      id: card.id || `card_${i}`,
      payoff_position: (analysis.payoff_order?.indexOf(card.name) ?? i) + 1,
    }))
    setCreditCards(enriched)
    return { cards: enriched, strategy: analysis }
  } catch (err) {
    console.error('Credit card analysis failed:', err.message)
    return { cards: getCreditCards(), strategy: null }
  }
}
