import { nansenService } from '../services/nansen.service';
import { coinGeckoService } from '../services/coingecko.service';
import { PortfolioAthFunFact } from '../types';

const ATH_LOOKBACK_DAYS = 365; // Look back 1 year for ATH
const TOP_HOLDINGS_COUNT = 30; // Top 30 holdings

/**
 * Calculates wallet's potential value if all current holdings were at their all-time highs
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

    // Step 3: Get ATH prices for each token
    const tokensToFetch = tokenHoldings.map((holding) => ({
      chain: holding.chain,
      address: holding.token_address,
    }));

    const athPrices = await coinGeckoService.batchGetATHPrices(
      tokensToFetch,
      ATH_LOOKBACK_DAYS
    );

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

