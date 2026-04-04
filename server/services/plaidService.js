import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid'

const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
})

export const plaidClient = new PlaidApi(config)

export async function createLinkToken() {
  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: 'spendshame-user-1' },
    client_name: 'SpendShame',
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: 'en',
  })
  return response.data.link_token
}

export async function exchangePublicToken(publicToken) {
  const response = await plaidClient.itemPublicTokenExchange({ public_token: publicToken })
  return response.data.access_token
}

export async function getTransactions(accessToken) {
  const now = new Date()
  const start = new Date(now)
  start.setDate(start.getDate() - 90)

  const response = await plaidClient.transactionsGet({
    access_token: accessToken,
    start_date: start.toISOString().split('T')[0],
    end_date: now.toISOString().split('T')[0],
    options: { count: 100 },
  })

  return response.data.transactions.map((tx) => ({
    merchant_name: tx.merchant_name || tx.name,
    amount: tx.amount,
    date: tx.date,
    category: tx.personal_finance_category?.primary || (tx.category?.[0] ?? 'Other'),
  }))
}
