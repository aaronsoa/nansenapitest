import 'dotenv/config';
import chalk from 'chalk';
import { subMonths, subYears, format } from 'date-fns';
import { nansenService } from './services/nansen.service';
import { formatUSD } from './utils/formatting';

const WALLET = '0x6313D7948D3491096Ffe00Dea2D246d588b4D4FC';

async function analyzeCoverage() {
  console.log(chalk.bold('\n╔═══════════════════════════════════════════════════════════════╗'));
  console.log(chalk.bold('║                                                               ║'));
  console.log(chalk.bold('║     📊  Coverage & API Call Analysis Report  📊              ║'));
  console.log(chalk.bold('║                                                               ║'));
  console.log(chalk.bold('╚═══════════════════════════════════════════════════════════════╝\n'));

  console.log(`Wallet: ${chalk.cyan(WALLET)}\n`);
  console.log(chalk.dim('Analyzing data coverage and API usage patterns...\n'));

  let totalApiCalls = 0;

  // ============================================================================
  // SECTION 1: RUGGED PROJECTS ANALYSIS
  // ============================================================================
  console.log(chalk.bold.yellow('━'.repeat(65)));
  console.log(chalk.bold.cyan('\n📦 RUGGED PROJECTS - Data Coverage Analysis\n'));

  const ruggedTimeframe = {
    from: subYears(new Date(), 1),
    to: new Date(),
  };

  console.log(`Timeframe: ${chalk.green(format(ruggedTimeframe.from, 'yyyy-MM-dd'))} to ${chalk.green(format(ruggedTimeframe.to, 'yyyy-MM-dd'))}`);
  console.log(chalk.dim('(Last 1 year of holdings)\n'));

  // Fetch ALL current holdings
  console.log(chalk.dim('Fetching current holdings...'));
  const allHoldingsResponse = await nansenService.getCurrentBalance({
    address: WALLET,
    chain: 'all',
    hide_spam_token: true,
    pagination: { page: 1, per_page: 100 },
    order_by: [{ field: 'value_usd', direction: 'DESC' }],
  });
  totalApiCalls++;

  const allHoldings = allHoldingsResponse.data || [];
  const tokenHoldings = allHoldings.filter(h => 
    h.token_address &&
    h.token_address.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' &&
    h.value_usd > 0
  );

  console.log(chalk.green(`✓ Fetched ${tokenHoldings.length} token holdings`));
  console.log(chalk.dim(`  API Calls: 1\n`));

  // Show breakdown
  console.log(chalk.bold('Holdings by Value Range:'));
  const ranges = [
    { min: 1000, max: Infinity, label: '> $1,000' },
    { min: 100, max: 1000, label: '$100 - $1,000' },
    { min: 10, max: 100, label: '$10 - $100' },
    { min: 0, max: 10, label: '< $10 (dust)' },
  ];

  ranges.forEach(range => {
    const count = tokenHoldings.filter(h => h.value_usd >= range.min && h.value_usd < range.max).length;
    const totalValue = tokenHoldings
      .filter(h => h.value_usd >= range.min && h.value_usd < range.max)
      .reduce((sum, h) => sum + h.value_usd, 0);
    console.log(`  ${range.label.padEnd(20)} ${String(count).padStart(3)} tokens  |  ${formatUSD(totalValue)}`);
  });

  console.log(chalk.bold('\nTop 10 Holdings:'));
  tokenHoldings.slice(0, 10).forEach((h, i) => {
    console.log(`  ${String(i + 1).padStart(2)}. ${h.token_symbol.padEnd(8)} ${formatUSD(h.value_usd).padStart(12)}  (${h.chain})`);
  });

  // ============================================================================
  // SECTION 2: ETH BENCHMARK ANALYSIS
  // ============================================================================
  console.log(chalk.bold.yellow('\n' + '━'.repeat(65)));
  console.log(chalk.bold.cyan('\n⚖️  ETH BENCHMARK - Transaction Coverage Analysis\n'));

  const ethBenchmarkTimeframe = {
    from: subMonths(new Date(), 6),
    to: new Date(),
  };

  console.log(`Timeframe: ${chalk.green(format(ethBenchmarkTimeframe.from, 'yyyy-MM-dd'))} to ${chalk.green(format(ethBenchmarkTimeframe.to, 'yyyy-MM-dd'))}`);
  console.log(chalk.dim('(Last 6 months of transactions)\n'));

  // Fetch ALL transactions in timeframe
  console.log(chalk.dim('Fetching all transactions...'));
  const allTransactionsResponse = await nansenService.getAllTransactions({
    address: WALLET,
    chain: 'ethereum',
    date: {
      from: ethBenchmarkTimeframe.from.toISOString(),
      to: ethBenchmarkTimeframe.to.toISOString(),
    },
    hide_spam_token: true,
    filters: { volume_usd: { min: 10 } },
    pagination: { page: 1, per_page: 100 },
    order_by: [{ field: 'block_timestamp', direction: 'ASC' }],
  });
  totalApiCalls++;

  const allTransactions = allTransactionsResponse.data || [];
  const buyTransactions = allTransactions.filter(
    tx => tx.tokens_received && tx.tokens_received.length > 0 && tx.volume_usd > 0
  );

  console.log(chalk.green(`✓ Fetched ${allTransactions.length} total transactions`));
  console.log(chalk.green(`✓ Filtered to ${buyTransactions.length} buy transactions`));
  console.log(chalk.dim(`  API Calls: 1 (pagination handled)\n`));

  // Sort by volume and show what we're sampling
  const sortedByVolume = [...buyTransactions].sort((a, b) => b.volume_usd - a.volume_usd);
  const top20 = sortedByVolume.slice(0, 20);
  const remaining = sortedByVolume.slice(20);

  const top20Volume = top20.reduce((sum, tx) => sum + tx.volume_usd, 0);
  const totalVolume = buyTransactions.reduce((sum, tx) => sum + tx.volume_usd, 0);
  const coveragePercent = totalVolume > 0 ? (top20Volume / totalVolume * 100) : 0;

  console.log(chalk.bold('Transaction Volume Distribution:'));
  console.log(`  Top 20 transactions:    ${formatUSD(top20Volume).padStart(12)}  (${coveragePercent.toFixed(1)}% of total)`);
  console.log(`  Remaining ${String(remaining.length).padStart(2)} txns:     ${formatUSD(totalVolume - top20Volume).padStart(12)}  (${(100 - coveragePercent).toFixed(1)}% of total)`);
  console.log(`  ${'Total'.padEnd(20)}    ${formatUSD(totalVolume).padStart(12)}`);

  console.log(chalk.bold('\nTop 20 Transactions by Volume:'));
  console.log(chalk.dim('  #  | Date       | Volume      | Method'));
  console.log(chalk.dim('  ---|------------|-------------|------------------'));
  top20.forEach((tx, i) => {
    const date = format(new Date(tx.block_timestamp), 'yyyy-MM-dd');
    const volume = formatUSD(tx.volume_usd).padStart(11);
    const method = (tx.method || 'unknown').slice(0, 15);
    console.log(`  ${String(i + 1).padStart(2)} | ${date} | ${volume} | ${method}`);
  });

  if (remaining.length > 0) {
    console.log(chalk.dim(`\n  ... and ${remaining.length} more transactions not shown`));
    console.log(chalk.dim(`      (combined volume: ${formatUSD(totalVolume - top20Volume)})`));
  }

  // ============================================================================
  // SECTION 3: PORTFOLIO ATH ANALYSIS
  // ============================================================================
  console.log(chalk.bold.yellow('\n' + '━'.repeat(65)));
  console.log(chalk.bold.cyan('\n📈 PORTFOLIO ATH - Holdings Coverage Analysis\n'));

  console.log(`Using: Current holdings data (already fetched above)`);
  console.log(chalk.dim('(All current holdings, filtered by $50 minimum)\n'));

  const minValue = 50;
  const athEligible = tokenHoldings.filter(h => h.value_usd >= minValue);
  const top10Holdings = athEligible.slice(0, 10);
  const dustFiltered = tokenHoldings.filter(h => h.value_usd < minValue);

  const top10Value = top10Holdings.reduce((sum, h) => sum + h.value_usd, 0);
  const eligibleValue = athEligible.reduce((sum, h) => sum + h.value_usd, 0);
  const totalValue = tokenHoldings.reduce((sum, h) => sum + h.value_usd, 0);

  console.log(chalk.bold('Holdings Value Distribution:'));
  console.log(`  Top 10 holdings (≥$${minValue}):  ${formatUSD(top10Value).padStart(12)}  (${(top10Value/totalValue*100).toFixed(1)}% of total)`);
  if (athEligible.length > 10) {
    console.log(`  Next ${String(athEligible.length - 10).padStart(2)} holdings:          ${formatUSD(eligibleValue - top10Value).padStart(12)}  (${((eligibleValue - top10Value)/totalValue*100).toFixed(1)}% of total)`);
  }
  if (dustFiltered.length > 0) {
    const dustValue = totalValue - eligibleValue;
    console.log(`  ${String(dustFiltered.length).padStart(2)} dust holdings (<$${minValue}):  ${formatUSD(dustValue).padStart(12)}  (${(dustValue/totalValue*100).toFixed(1)}% of total)`);
  }
  console.log(`  ${'Total Portfolio'.padEnd(26)}  ${formatUSD(totalValue).padStart(12)}`);

  console.log(chalk.bold('\nTop 10 Holdings (ATH Analysis):'));
  console.log(chalk.dim('  #  | Symbol  | Chain     | Current Value | Price USD'));
  console.log(chalk.dim('  ---|---------|-----------|---------------|----------'));
  top10Holdings.forEach((h, i) => {
    const symbol = h.token_symbol.padEnd(7);
    const chain = h.chain.padEnd(9);
    const value = formatUSD(h.value_usd).padStart(13);
    const price = `$${h.price_usd.toFixed(4)}`;
    console.log(`  ${String(i + 1).padStart(2)} | ${symbol} | ${chain} | ${value} | ${price}`);
  });

  // API calls for ATH: 1 for current price + 10 for ATH prices
  console.log(chalk.dim('\n  Expected API Calls for ATH:'));
  console.log(chalk.dim(`    - Current ETH price: 1 call`));
  console.log(chalk.dim(`    - ATH prices (top 10): 10 calls (batched in groups of 5)`));
  console.log(chalk.dim(`    - Total: 11 calls`));

  // ============================================================================
  // SECTION 4: COMPLETE ASSET HISTORY
  // ============================================================================
  console.log(chalk.bold.yellow('\n' + '━'.repeat(65)));
  console.log(chalk.bold.cyan('\n📜 COMPLETE ASSET HISTORY - All Assets Ever Owned\n'));

  console.log(chalk.dim('Analyzing all transaction history to build complete asset list...\n'));

  // Fetch ALL historical transactions (Ethereum only - most common chain)
  console.log(chalk.dim('Fetching complete transaction history (Ethereum chain)...'));
  const historyStartDate = subYears(new Date(), 5); // Last 5 years
  const completeHistoryResponse = await nansenService.getAllTransactions({
    address: WALLET,
    chain: 'ethereum',
    date: {
      from: historyStartDate.toISOString(),
      to: new Date().toISOString(),
    },
    hide_spam_token: true,
    pagination: { page: 1, per_page: 100 },
    order_by: [{ field: 'block_timestamp', direction: 'DESC' }],
  });
  totalApiCalls++;
  
  console.log(chalk.dim('Note: Fetching last 5 years of Ethereum chain history'));

  const allHistoricalTxs = completeHistoryResponse.data || [];
  console.log(chalk.green(`✓ Fetched ${allHistoricalTxs.length} historical transactions`));

  // Extract all unique tokens from transactions
  const uniqueTokens = new Map<string, {
    symbol: string;
    chain: string;
    firstSeen: Date;
    lastSeen: Date;
    txCount: number;
  }>();

  allHistoricalTxs.forEach(tx => {
    const txDate = new Date(tx.block_timestamp);
    
    // Tokens received
    tx.tokens_received?.forEach(token => {
      const key = `${token.token_address}-${tx.chain}`.toLowerCase();
      if (!uniqueTokens.has(key)) {
        uniqueTokens.set(key, {
          symbol: token.token_symbol || 'UNKNOWN',
          chain: tx.chain,
          firstSeen: txDate,
          lastSeen: txDate,
          txCount: 1,
        });
      } else {
        const existing = uniqueTokens.get(key)!;
        existing.txCount++;
        if (txDate < existing.firstSeen) existing.firstSeen = txDate;
        if (txDate > existing.lastSeen) existing.lastSeen = txDate;
      }
    });

    // Tokens sent
    tx.tokens_sent?.forEach(token => {
      const key = `${token.token_address}-${tx.chain}`.toLowerCase();
      if (!uniqueTokens.has(key)) {
        uniqueTokens.set(key, {
          symbol: token.token_symbol || 'UNKNOWN',
          chain: tx.chain,
          firstSeen: txDate,
          lastSeen: txDate,
          txCount: 1,
        });
      } else {
        const existing = uniqueTokens.get(key)!;
        existing.txCount++;
        if (txDate < existing.firstSeen) existing.firstSeen = txDate;
        if (txDate > existing.lastSeen) existing.lastSeen = txDate;
      }
    });
  });

  const allTokensEverOwned = Array.from(uniqueTokens.values()).sort((a, b) => b.txCount - a.txCount);

  console.log(chalk.bold(`\n📊 Complete Asset History Summary:`));
  console.log(`  Total unique tokens ever owned: ${chalk.green(allTokensEverOwned.length)}`);
  console.log(`  Total historical transactions:  ${chalk.green(allHistoricalTxs.length)}`);
  console.log(`  Currently holding:              ${chalk.green(tokenHoldings.length)}`);
  console.log(`  No longer holding:              ${chalk.yellow(allTokensEverOwned.length - tokenHoldings.length)}`);

  console.log(chalk.bold('\nTop 20 Most Traded Assets (by transaction count):'));
  console.log(chalk.dim('  #  | Symbol    | Chain     | Tx Count | First Seen | Last Seen'));
  console.log(chalk.dim('  ---|-----------|-----------|----------|------------|----------'));
  allTokensEverOwned.slice(0, 20).forEach((token, i) => {
    const symbol = token.symbol.padEnd(9);
    const chain = token.chain.padEnd(9);
    const txCount = String(token.txCount).padStart(8);
    const firstSeen = format(token.firstSeen, 'yyyy-MM-dd');
    const lastSeen = format(token.lastSeen, 'yyyy-MM-dd');
    console.log(`  ${String(i + 1).padStart(2)} | ${symbol} | ${chain} | ${txCount} | ${firstSeen} | ${lastSeen}`);
  });

  if (allTokensEverOwned.length > 20) {
    console.log(chalk.dim(`\n  ... and ${allTokensEverOwned.length - 20} more tokens`));
  }

  // Compare current holdings vs historical
  const currentSymbols = new Set(tokenHoldings.map(h => `${h.token_symbol}-${h.chain}`));
  const soldTokens = allTokensEverOwned.filter(t => !currentSymbols.has(`${t.symbol}-${t.chain}`));

  console.log(chalk.bold('\nAsset Status:'));
  console.log(`  Still holding:     ${chalk.green(tokenHoldings.length)} tokens`);
  console.log(`  Sold/transferred:  ${chalk.yellow(soldTokens.length)} tokens`);
  console.log(`  Retention rate:    ${chalk.cyan((tokenHoldings.length / allTokensEverOwned.length * 100).toFixed(1) + '%')}`);

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================
  console.log(chalk.bold.yellow('\n' + '━'.repeat(65)));
  console.log(chalk.bold.cyan('\n📊 API CALLS & COVERAGE SUMMARY\n'));

  console.log(chalk.bold('Total API Calls for Analysis:'));
  console.log(`  Current Holdings:        1 call`);
  console.log(`  ETH Benchmark (6mo):     1 call`);
  console.log(`  Complete History:        1 call`);
  console.log(`  Portfolio ATH (runtime): 11 calls (estimated)`);
  console.log(chalk.bold(`  Total:                   ${totalApiCalls} calls (+ 11 for ATH = 14 total)`));

  console.log(chalk.bold('\nCoverage Efficiency:'));
  console.log(`  ETH Benchmark:           ${coveragePercent.toFixed(1)}% volume coverage with ${((top20.length/buyTransactions.length)*100).toFixed(1)}% of transactions`);
  console.log(`  Portfolio ATH:           ${(top10Value/totalValue*100).toFixed(1)}% value coverage with top 10 holdings`);
  console.log(`  Rugged Projects:         100% of current holdings analyzed`);

  console.log(chalk.bold.green('\n✓ Coverage Analysis Complete!\n'));
}

analyzeCoverage()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(chalk.red('\n❌ Analysis failed:'), err);
    process.exit(1);
  });

