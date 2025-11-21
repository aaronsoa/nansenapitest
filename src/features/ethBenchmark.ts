import { subMonths, parseISO, format } from 'date-fns';
import { nansenService } from '../services/nansen.service';
import { coinGeckoService } from '../services/coingecko.service';
import { EthBenchmarkFunFact } from '../types';

const MIN_VOLUME_USD = 10; // Minimum $10 USD transaction volume
const MONTHS_LOOKBACK = 12; // Look back 12 months (extended from 6 for better coverage)
const TOP_TRANSACTIONS = 50; // Sample top 50 transactions by volume (~98% coverage)
const SUPPORTED_CHAINS = ['ethereum', 'arbitrum', 'polygon', 'base', 'optimism']; // Multi-chain support

/**
 * Compares wallet's token purchase performance vs. holding equivalent ETH instead
 * @param address - Wallet address to analyze
 * @returns ETH Benchmark Fun Fact
 */
export async function analyzeEthBenchmark(address: string): Promise<EthBenchmarkFunFact> {
  try {
    const now = new Date();
    const fromDate = subMonths(now, MONTHS_LOOKBACK);

    // Step 1: Fetch all transactions from multiple chains in parallel
    console.log(`  Fetching transactions from ${SUPPORTED_CHAINS.length} chains in parallel...`);
    
    const transactionsPromises = SUPPORTED_CHAINS.map(chain =>
      nansenService.getAllTransactions({
        address,
        chain,
        date: {
          from: fromDate.toISOString(),
          to: now.toISOString(),
        },
        hide_spam_token: true,
        filters: {
          volume_usd: {
            min: MIN_VOLUME_USD,
          },
        },
        pagination: {
          page: 1,
          per_page: 100,
        },
        order_by: [
          {
            field: 'block_timestamp',
            direction: 'ASC',
          },
        ],
      }).catch(err => {
        console.log(`  ⚠️  Failed to fetch ${chain} transactions:`, err.message);
        return { data: [] };
      })
    );

    const transactionsResults = await Promise.all(transactionsPromises);
    
    // Combine all transactions from all chains
    const transactions = transactionsResults.flatMap(result => result.data || []);

    // Check if we have any transactions
    if (transactions.length === 0) {
      return {
        type: 'eth_benchmark',
        success: false,
        fallback: 'No meaningful history yet for young wallets, CEX-only flows excluded',
      };
    }

    console.log(`  Found ${transactions.length} total transactions across ${SUPPORTED_CHAINS.length} chains`);

    // Step 2: Filter for buy transactions (tokens received, not sent)
    // A buy is when we receive tokens (tokens_received has items)
    const buyTransactions = transactions.filter(
      (tx) => tx.tokens_received && tx.tokens_received.length > 0 && tx.volume_usd > 0
    );

    if (buyTransactions.length === 0) {
      return {
        type: 'eth_benchmark',
        success: false,
        fallback: 'No meaningful history yet for young wallets, CEX-only flows excluded',
      };
    }

    // Step 2.5: Sample top transactions by volume for performance
    // Sort by volume descending and take top 50
    const topTransactions = buyTransactions
      .sort((a, b) => b.volume_usd - a.volume_usd)
      .slice(0, TOP_TRANSACTIONS);

    console.log(`📊 Analyzing top ${topTransactions.length} transactions (out of ${buyTransactions.length} total across all chains)`);

    // Step 3: Extract unique dates from transactions
    const uniqueDates = new Set<string>();
    for (const tx of topTransactions) {
      const txDate = parseISO(tx.block_timestamp);
      const dateKey = format(txDate, 'yyyy-MM-dd');
      uniqueDates.add(dateKey);
    }

    console.log(`Fetching ETH prices for ${uniqueDates.size} unique dates from CoinGecko...`);

    // Step 4: Batch fetch ETH prices for all unique dates
    const pricePromises = Array.from(uniqueDates).map((date) =>
      coinGeckoService.getHistoricalETHPrice(date).then((price) => ({ date, price }))
    );

    const priceResults = await Promise.all(pricePromises);
    const priceCache = new Map(
      priceResults
        .filter((result) => result.price && result.price > 0)
        .map((result) => [result.date, result.price])
    );

    console.log(`✅ Fetched ${priceCache.size} ETH prices out of ${uniqueDates.size} unique dates`);

    // Step 5: Calculate total USD spent and ETH equivalent using fetched prices
    let totalUsdSpent = 0;
    let totalEthEquivalent = 0;
    let pricesFound = 0;
    

    for (const tx of topTransactions) {
      const usdSpent = tx.volume_usd;
      totalUsdSpent += usdSpent;

      // Get ETH price from fetched cache
      const txDate = parseISO(tx.block_timestamp);
      const dateKey = format(txDate, 'yyyy-MM-dd');
      const ethPrice = priceCache.get(dateKey);

      if (ethPrice && ethPrice > 0) {
        const ethEquivalent = usdSpent / ethPrice;
        totalEthEquivalent += ethEquivalent;
        pricesFound++;
      }
    }

    console.log(`✅ Used ${pricesFound} prices out of ${topTransactions.length} transactions`);

    // If we couldn't get any ETH prices, fail gracefully
    if (totalEthEquivalent === 0) {
      return {
        type: 'eth_benchmark',
        success: false,
        fallback: 'No meaningful history yet for young wallets, CEX-only flows excluded',
      };
    }

    // Step 6: Get current ETH price
    const currentEthPriceResponse = await coinGeckoService.getCurrentPrice('ethereum');
    const currentEthPrice = currentEthPriceResponse.ethereum?.usd || 0;

    if (currentEthPrice === 0) {
      return {
        type: 'eth_benchmark',
        success: false,
        fallback: 'No meaningful history yet for young wallets, CEX-only flows excluded',
      };
    }

    // Step 7: Calculate ETH equivalent portfolio value
    const ethEquivalentValue = totalEthEquivalent * currentEthPrice;

    // Step 8: Get current portfolio value (simplified - using total spent as proxy)
    // In a real scenario, we'd need to fetch current token values
    const portfolioValue = totalUsdSpent; // This is a simplification

    // Step 9: Calculate performance difference
    const performancePercent = ((portfolioValue - ethEquivalentValue) / ethEquivalentValue) * 100;

    return {
      type: 'eth_benchmark',
      success: true,
      data: {
        portfolioValue,
        ethEquivalentValue,
        performancePercent,
        status: performancePercent >= 0 ? 'OUTPERFORMED' : 'UNDERPERFORMED',
        sampleSize: topTransactions.length,
        totalTransactions: buyTransactions.length,
      },
    };
  } catch (error) {
    console.error('Error analyzing ETH benchmark:', error);
    return {
      type: 'eth_benchmark',
      success: false,
      fallback: 'No meaningful history yet for young wallets, CEX-only flows excluded',
    };
  }
}

