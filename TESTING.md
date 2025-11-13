# Testing Guide

## Overview

This document provides guidance on testing the Fun Facts POC with various wallet addresses.

## Running Tests

### Automated Test Script

Run the automated test with the sample wallet:

```bash
npm test
```

This will test all 6 fun facts with the sample wallet address: `0xF977814e90dA44bFA03b6295A0616a897441aceC`

### Interactive CLI

Run the interactive CLI to test with any wallet address:

```bash
npm start
```

Or for development:

```bash
npm run dev
```

## Test Scenarios

### Test Wallet Addresses

Here are some suggested wallet addresses for testing different scenarios:

1. **Sample Wallet** (from documentation)
   - Address: `0xF977814e90dA44bFA03b6295A0616a897441aceC`
   - Binance exchange wallet - may show limited history

2. **Vitalik Buterin's Wallet**
   - Address: `0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045`
   - Should show labels, smart money, and rich history

3. **WETH Contract**
   - Address: `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`
   - Contract address for testing edge cases

## Expected Behaviors

### Fun Fact 1: P&L (Profit & Loss)

**Success Case:**
- Shows percentage and USD value of realized P&L
- Status: GAIN (green) or LOSS (red)
- Time frame: "in the past year"

**Fallback:**
- "Only mist—too little history to read."

### Fun Fact 2: Labels

**Success Case:**
- Shows highest priority label (e.g., "Whale", "Active Trader")

**Fallback:**
- "No priority labels found for this wallet"

### Fun Fact 3: Smart Money Trader

**Success Case:**
- "✨ Smart Money Detected! Labels: [label names]"

**Fallback:**
- "Not identified as smart money trader"

### Fun Fact 4: Rugged Projects

**Success Case:**
- Lists potentially rugged projects with liquidity < $10,000
- Shows token symbol, name, and liquidity

**Fallback:**
- "No rugged projects detected—clear skies ahead"

### Fun Fact 5: ETH Benchmark

**Success Case:**
- Compares portfolio performance vs. holding ETH
- Shows OUTPERFORMED or UNDERPERFORMED status
- Displays portfolio value and ETH equivalent value

**Fallback:**
- "No meaningful history yet for young wallets, CEX-only flows excluded"

### Fun Fact 6: Portfolio at ATH

**Success Case:**
- Shows current portfolio value
- Shows potential value at ATH
- Calculates potential gain percentage

**Fallback:**
- "No meaningful history yet for young/empty wallets"

## API Rate Limits

### Nansen API
- The POC includes error handling for rate limits
- Errors are logged but don't crash the application

### CoinGecko API
- Free tier: 10-50 calls/minute
- The POC includes 1-second delays between batch requests
- Handles errors gracefully with fallback values

## Troubleshooting

### API Key Issues

If you see "NANSEN_API_KEY is not set":
1. Ensure `.env` file exists in project root
2. Verify the API key is correctly set
3. Try restarting the application

### Network Issues

If API calls fail:
1. Check internet connection
2. Verify API keys are valid
3. Check if APIs are responding (test with curl)

### Empty Results

Some wallets may return empty results if:
- The wallet is new with no transaction history
- The wallet is a contract address
- The wallet only interacts with CEX (centralized exchanges)
- Nansen doesn't have sufficient data for that wallet

This is expected behavior and the fallback messages will be shown.

## Performance Notes

- **P&L Analysis**: ~1-2 seconds (single API call)
- **Labels**: ~1-2 seconds (single API call)
- **Smart Money**: ~1-2 seconds (uses same data as Labels)
- **Rugged Projects**: ~3-5 seconds (multiple API calls)
- **ETH Benchmark**: ~10-30 seconds (multiple historical price queries)
- **Portfolio ATH**: ~15-45 seconds (batch ATH price queries)

Total analysis time: **30-90 seconds** depending on wallet complexity and API response times.

## Test Checklist

- [ ] Test with sample wallet address
- [ ] Test with a popular wallet (e.g., Vitalik's)
- [ ] Test with empty/new wallet address
- [ ] Test with invalid address format
- [ ] Test address validation (wrong format, length, etc.)
- [ ] Verify all 6 fun facts display correctly
- [ ] Verify fallback messages display when appropriate
- [ ] Test "analyze another wallet" flow
- [ ] Verify colored output (gains in green, losses in red)
- [ ] Check error handling for network issues

