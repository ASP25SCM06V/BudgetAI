<<<<<<< HEAD
# BudgetAI
=======
# SpendShame

> Your money has a villain. His name is you.

## Setup

### 1. Install dependencies
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment
```bash
cp server/.env.example server/.env
# Fill in: PLAID_CLIENT_ID, PLAID_SECRET, ANTHROPIC_API_KEY
```

### 3. Run
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

### 4. Plaid Sandbox credentials
- Username: `user_good`
- Password: `pass_good`
- Select: **First Platypus Bank**

## Demo Mode
Click "Demo Mode" on the landing page — no Plaid account needed.
>>>>>>> 3e41593 (feat: monorepo scaffold — server + client package setup)
