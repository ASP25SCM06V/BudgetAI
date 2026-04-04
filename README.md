# SpendShame

> Your money has a villain. His name is you.

SpendShame is a fintech application that helps you track and analyze your spending habits using AI-powered insights. Connect your bank accounts via Plaid and get personalized feedback on your financial decisions.

## Features

- **Bank Account Integration**: Securely connect your bank accounts using Plaid
- **AI-Powered Analysis**: Get insights and feedback on your spending patterns using Anthropic's Claude
- **Demo Mode**: Try the app without connecting real accounts
- **Modern UI**: Built with React, Vite, and Tailwind CSS

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Banking API**: Plaid
- **AI**: Anthropic Claude
- **Deployment**: Monorepo setup with client and server

## Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### 1. Install Dependencies

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp server/.env.example server/.env

# Edit server/.env and fill in the required values:
# PLAID_CLIENT_ID=your_plaid_client_id
# PLAID_SECRET=your_plaid_secret
# ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 3. Get API Keys

- **Plaid**: Sign up at [plaid.com](https://plaid.com) for sandbox credentials
- **Anthropic**: Get your API key from [anthropic.com](https://anthropic.com)

### 4. Run the Application

```bash
# Terminal 1: Start the server
cd server && npm run dev

# Terminal 2: Start the client
cd ../client && npm run dev
```

The application will be available at:
- Client: http://localhost:5173
- Server: http://localhost:3000

### 5. Plaid Sandbox Credentials

For testing with Plaid's sandbox environment:
- Username: `user_good`
- Password: `pass_good`
- Select: **First Platypus Bank**

## Demo Mode

Click "Demo Mode" on the landing page to try the app without connecting real bank accounts.

## Project Structure

```
├── client/          # React frontend
├── server/          # Node.js backend
├── docs/           # Documentation
│   └── superpowers/# Project plans and ideas
└── README.md       # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
