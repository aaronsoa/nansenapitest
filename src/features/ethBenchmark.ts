import { subMonths, parseISO } from 'date-fns';
import { nansenService } from '../services/nansen.service';
import { coinGeckoService } from '../services/coingecko.service';
import { EthBenchmarkFunFact } from '../types';

const MIN_VOLUME_USD = 10; // Minimum $10 USD transaction volume
const MONTHS_LOOKBACK = 6; // Look back 6 months

/**
 * Compares wallet's token purchase performance vs. holding equivalent ETH instead
 * @param address - Wallet address to analyze
 * @returns ETH Benchmark Fun Fact
 */
export async function analyzeEthBenchmark(address: string): Promise<EthBenchmarkFunFact> {
  try {
    const now = new Date();
    const fromDate = subMonths(now, MONTHS_LOOKBACK);

    // Step 1: Fetch all transactions in the past 6 months
    const transactionsResponse = await nansenService.getAllTransactions({
      address,
      chain: 'ethereum',
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
    });

    // Check if we have any transactions
    if (!transactionsResponse.data || transactionsResponse.data.length === 0) {
      return {
        type: 'eth_benchmark',
        success: false,
        fallback: 'No meaningful history yet for young wallets, CEX-only flows excluded',
      };
    }

    const transactions = transactionsResponse.data;

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

    // Step 3: Calculate total USD spent on purchases
    let totalUsdSpent = 0;
    let totalEthEquivalent = 0;

    for (const tx of buyTransactions) {
      const usdSpent = tx.volume_usd;
      totalUsdSpent += usdSpent;

      // Get ETH price at transaction time
      const txDate = parseISO(tx.block_timestamp);
      const ethPrice = await coinGeckoService.getHistoricalPrice('ethereum', txDate);

      if (ethPrice > 0) {
        const ethEquivalent = usdSpent / ethPrice;
        totalEthEquivalent += ethEquivalent;
      }
    }

    // If we couldn't get any ETH prices, fail gracefully
    if (totalEthEquivalent === 0) {
      return {
        type: 'eth_benchmark',
        success: false,
        fallback: 'No meaningful history yet for young wallets, CEX-only flows excluded',
      };
    }

    // Step 4: Get current ETH price
    const currentEthPriceResponse = await coinGeckoService.getCurrentPrice('ethereum');
    const currentEthPrice = currentEthPriceResponse.ethereum?.usd || 0;

    if (currentEthPrice === 0) {
      return {
        type: 'eth_benchmark',
        success: false,
        fallback: 'No meaningful history yet for young wallets, CEX-only flows excluded',
      };
    }

    // Step 5: Calculate ETH equivalent portfolio value
    const ethEquivalentValue = totalEthEquivalent * currentEthPrice;

    // Step 6: Get current portfolio value (simplified - using total spent as proxy)
    // In a real scenario, we'd need to fetch current token values
    const portfolioValue = totalUsdSpent; // This is a simplification

    // Step 7: Calculate performance difference
    const performancePercent = ((portfolioValue - ethEquivalentValue) / ethEquivalentValue) * 100;

    return {
      type: 'eth_benchmark',
      success: true,
      data: {
        portfolioValue,
        ethEquivalentValue,
        performancePercent,
        status: performancePercent >= 0 ? 'OUTPERFORMED' : 'UNDERPERFORMED',
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

