export const demoTransactions = [
  { merchant_name: 'Starbucks', amount: 7.45, date: '2026-04-01', category: 'Food and Drink' },
  { merchant_name: 'Starbucks', amount: 6.95, date: '2026-03-30', category: 'Food and Drink' },
  { merchant_name: 'Starbucks', amount: 8.20, date: '2026-03-29', category: 'Food and Drink' },
  { merchant_name: 'Uber Eats', amount: 34.50, date: '2026-04-01', category: 'Food and Drink' },
  { merchant_name: 'Uber Eats', amount: 41.20, date: '2026-03-28', category: 'Food and Drink' },
  { merchant_name: 'DoorDash', amount: 28.75, date: '2026-03-25', category: 'Food and Drink' },
  { merchant_name: 'Netflix', amount: 15.49, date: '2026-03-20', category: 'Entertainment' },
  { merchant_name: 'Spotify', amount: 9.99, date: '2026-03-20', category: 'Entertainment' },
  { merchant_name: 'Hulu', amount: 17.99, date: '2026-03-18', category: 'Entertainment' },
  { merchant_name: 'Amazon Prime', amount: 14.99, date: '2026-03-15', category: 'Shopping' },
  { merchant_name: 'Amazon', amount: 67.34, date: '2026-04-02', category: 'Shopping' },
  { merchant_name: 'Amazon', amount: 23.99, date: '2026-03-27', category: 'Shopping' },
  { merchant_name: 'Target', amount: 112.40, date: '2026-03-22', category: 'Shopping' },
  { merchant_name: 'Walgreens', amount: 18.50, date: '2026-03-21', category: 'Shopping' },
  { merchant_name: 'Chipotle', amount: 14.25, date: '2026-03-31', category: 'Food and Drink' },
  { merchant_name: "McDonald's", amount: 8.90, date: '2026-03-28', category: 'Food and Drink' },
  { merchant_name: 'Discord Nitro', amount: 9.99, date: '2026-03-01', category: 'Entertainment' },
  { merchant_name: 'Notion', amount: 16.00, date: '2026-03-01', category: 'Software' },
  { merchant_name: 'Grubhub', amount: 52.10, date: '2026-03-15', category: 'Food and Drink' },
  { merchant_name: 'Taco Bell', amount: 11.30, date: '2026-03-26', category: 'Food and Drink' },
]

export const demoHealthScore = {
  score: 74,
  grade: 'B',
  summary: "You're doing well overall — your shopping and subscriptions are manageable. There's room to improve in food delivery spending, which is higher than average for your income bracket.",
  categories: {
    spending_control: 68,
    subscription_efficiency: 72,
    savings_rate: 80,
    diversity: 76,
  },
  top_insight: 'Cutting delivery apps to twice a week could save you $240/month.',
  computed_at: new Date().toISOString(),
}

export const demoSubscriptions = [
  {
    id: 'sub_1',
    name: 'Netflix',
    amount: 15.49,
    frequency: 'monthly',
    category: 'Entertainment',
    last_charged: '2026-03-20',
    status: 'active',
    usage_signal: 'Charged every month, consistent usage detected.',
  },
  {
    id: 'sub_2',
    name: 'Spotify',
    amount: 9.99,
    frequency: 'monthly',
    category: 'Entertainment',
    last_charged: '2026-03-20',
    status: 'active',
    usage_signal: 'Charged monthly, regular listener.',
  },
  {
    id: 'sub_3',
    name: 'Adobe Creative Cloud',
    amount: 54.99,
    frequency: 'monthly',
    category: 'Software',
    last_charged: '2026-03-01',
    status: 'unused',
    usage_signal: 'No complementary purchases or activity detected in 90 days — likely unused.',
  },
]

export const demoBudgets = [
  { id: 'bud_1', category: 'Food & Drink', limit: 300, spent: 363.60, icon: '🍔' },
  { id: 'bud_2', category: 'Shopping', limit: 250, spent: 236.22, icon: '🛍️' },
  { id: 'bud_3', category: 'Entertainment', limit: 100, spent: 69.45, icon: '🎬' },
  { id: 'bud_4', category: 'Software', limit: 50, spent: 25.99, icon: '💻' },
]

export const demoCreditCards = [
  {
    id: 'card_1',
    name: 'Chase Visa',
    balance: 2340,
    limit: 5000,
    apr: 22.99,
    min_payment: 35,
    payoff_position: 1,
  },
  {
    id: 'card_2',
    name: 'Amex Blue',
    balance: 780,
    limit: 6500,
    apr: 18.24,
    min_payment: 25,
    payoff_position: 2,
  },
]

export const demoCreditStrategy = {
  strategy: 'avalanche',
  strategy_reason: 'Avalanche method targets the Chase Visa first since it has the highest APR at 22.99%. This saves you the most interest over time.',
  estimated_savings: 340,
  payoff_order: ['Chase Visa', 'Amex Blue'],
  aria_recommendation: "Pay an extra $100/month on your Chase Visa — you'll be debt-free 8 months sooner and save $340 in interest.",
}

export const demoInsights = [
  {
    id: 'ins_1',
    type: 'warning',
    title: 'Food delivery over budget',
    body: "You've spent $363 on food this month — $63 over your $300 budget. Uber Eats and DoorDash account for 65% of that. Cooking twice a week could save you $120/month.",
    action: 'Set a delivery limit',
    action_route: '/budgets',
  },
  {
    id: 'ins_2',
    type: 'alert',
    title: 'Unused subscription detected',
    body: "You're paying $54.99/month for Adobe Creative Cloud but there's no sign it's being used. That's $660/year on software collecting dust.",
    action: 'Review subscriptions',
    action_route: '/subscriptions',
  },
  {
    id: 'ins_3',
    type: 'tip',
    title: 'Avalanche your credit card debt',
    body: 'Your Chase Visa at 22.99% APR is costing you the most in interest. Pay it down first — $100 extra per month saves you $340 and gets you clear 8 months sooner.',
    action: 'See payoff plan',
    action_route: '/credit-cards',
  },
  {
    id: 'ins_4',
    type: 'win',
    title: 'Solid savings rate',
    body: "Your savings rate is in the top 25% for your spending level. Keep building that buffer — Aria recommends hitting 3 months of expenses before investing more.",
    action: null,
    action_route: null,
  },
]
