import { nansenService } from '../services/nansen.service';
import { coinGeckoService } from '../services/coingecko.service';
import { PortfolioAthFunFact } from '../types';
import { athCache } from '../utils/athCache';

const ATH_LOOKBACK_DAYS = 365; // Look back 1 year for ATH
const TOP_HOLDINGS_COUNT = 30; // Top 30 holdings

/**
 * Calculates wallet's potential value if all current holdings were at their all-time highs
 * 
 * PRD Compliance:
 * - Uses `/api/v1/profiler/address/current-balance` for top 30 holdings
 * - Uses CoinGecko `/market_chart` for ATH prices (1-year lookback)
 * - Implements ATH caching to reduce API calls by 80%+
 * - Excludes ETH and native tokens
 * - Fallback: "No meaningful history yet for young/empty wallets"
 * 
 * Performance Optimization:
 * - Caches ATH prices for 24 hours
 * - Reduces redundant API calls for repeated analyses
 * - Significantly reduces rate limit issues
 * 
 * @param address - Wallet address to analyze
 * @returns Portfolio ATH Fun Fact
 */
export async function analyzePortfolioATH(address: string): Promise<PortfolioAthFunFact> {
  try {
    // Step 1: Fetch top holdings (excluding ETH)
    const balanceResponse = await nansenService.getCurrentBalance({
      address,
      chain: 'all',
      hide_spam_token: true,
      pagination: {
        page: 1,
        per_page: TOP_HOLDINGS_COUNT,
      },
      order_by: [
        {
          field: 'value_usd',
          direction: 'DESC',
        },
      ],
    });

    // Check if wallet has any holdings
    if (!balanceResponse.data || balanceResponse.data.length === 0) {
      return {
        type: 'portfolio_ath',
        success: false,
        fallback: 'No meaningful history yet for young/empty wallets',
      };
    }

    const holdings = balanceResponse.data;

    // Filter out ETH/native tokens (0xeeee... addresses are native tokens)
    const tokenHoldings = holdings.filter(
      (holding) =>
        holding.token_address &&
        holding.token_address.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' &&
        holding.token_address.toLowerCase() !== '0x000000000000000000000000000000000000800a' && // ZkSync ETH
        holding.chain &&
        holding.value_usd > 0
    );

    if (tokenHoldings.length === 0) {
      return {
        type: 'portfolio_ath',
        success: false,
        fallback: 'No meaningful history yet for young/empty wallets',
      };
    }

    // Step 2: Calculate current portfolio value
    let currentValue = 0;
    for (const holding of tokenHoldings) {
      currentValue += holding.value_usd;
    }

    // Step 3: Check cache and prepare tokens to fetch
    console.log(`[Portfolio ATH] Checking cache for ${tokenHoldings.length} tokens...`);
    
    const athPrices = new Map<string, { athPrice: number; athDate: Date | null }>();
    const tokensToFetch: Array<{ chain: string; address: string }> = [];
    let cacheHits = 0;

    // Check cache first
    for (const holding of tokenHoldings) {
      const cached = athCache.get(holding.token_address);
      if (cached) {
        athPrices.set(holding.token_address.toLowerCase(), cached);
        cacheHits++;
      } else {
        tokensToFetch.push({
          chain: holding.chain,
          address: holding.token_address,
        });
      }
    }

    console.log(`[Portfolio ATH] Cache hits: ${cacheHits}/${tokenHoldings.length}`);
    console.log(`[Portfolio ATH] Need to fetch: ${tokensToFetch.length} tokens`);

    // Fetch uncached ATH prices from CoinGecko
    if (tokensToFetch.length > 0) {
      const fetchedPrices = await coinGeckoService.batchGetATHPrices(
        tokensToFetch,
        ATH_LOOKBACK_DAYS
      );

      // Store fetched prices in cache
      for (const [address, athData] of fetchedPrices.entries()) {
        athPrices.set(address, athData);
        
        // Cache the result if valid
        if (athData.athPrice > 0 && athData.athDate) {
          athCache.set(address, athData.athPrice, athData.athDate);
        }
      }
    }

    // Log cache statistics
    const cacheStats = athCache.getStats();
    console.log(`[Portfolio ATH] Cache stats:`, cacheStats);

    // Step 4: Calculate ATH portfolio value
    let athValue = 0;
    let successfulTokens = 0;

    for (const holding of tokenHoldings) {
      const athData = athPrices.get(holding.token_address.toLowerCase());

      if (athData && athData.athPrice > 0) {
        // Calculate token amount
        const tokenAmount = parseFloat(holding.balance);

        // Calculate value at ATH
        const athTokenValue = tokenAmount * athData.athPrice;
        athValue += athTokenValue;
        successfulTokens++;
      } else {
        // If we can't get ATH, use current value as fallback
        athValue += holding.value_usd;
      }
    }

    // If we couldn't get ATH data for any tokens, fail gracefully
    if (successfulTokens === 0) {
      return {
        type: 'portfolio_ath',
        success: false,
        fallback: 'No meaningful history yet for young/empty wallets',
      };
    }

    // Step 5: Calculate potential gain
    const potentialGainPercent = ((athValue - currentValue) / currentValue) * 100;

    return {
      type: 'portfolio_ath',
      success: true,
      data: {
        currentValue,
        athValue,
        potentialGainPercent,
      },
    };
  } catch (error) {
    console.error('Error analyzing portfolio ATH:', error);
    return {
      type: 'portfolio_ath',
      success: false,
      fallback: 'No meaningful history yet for young/empty wallets',
    };
  }
}

