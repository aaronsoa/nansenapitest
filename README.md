# Fun Facts POC - Interactive Wallet Analyzer

An interactive CLI tool that analyzes crypto wallet addresses using Nansen and CoinGecko APIs to generate 6 types of "Fun Facts".

## Features

1. **P&L (Profit & Loss)** - Analyzes realized profit/loss over the past year
2. **Labels** - Identifies wallet tags (Whale, Active Trader, Staker, etc.)
3. **Smart Money Traders** - Detects professional trader wallets
4. **Rugged Projects** - Finds tokens in rugged/scam projects
5. **ETH Benchmark** - Compares portfolio performance vs. holding ETH
6. **Portfolio at ATH** - Calculates potential value if all holdings were at all-time highs

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your API keys:
```bash
cp .env.example .env
```

3. Edit `.env` and add your Nansen API key:
```
NANSEN_API_KEY=your_key_here
```

## Usage

Run the interactive CLI:
```bash
npm start
```

Or for development:
```bash
npm run dev
```

## Sample Wallet Address

For testing: `0xF977814e90dA44bFA03b6295A0616a897441aceC`

## Technical Stack

- TypeScript
- Node.js
- Axios (API calls)
- Inquirer (interactive prompts)
- Chalk (colored output)
- date-fns (date handling)

