import { nansenService } from '../services/nansen.service';
import { coinGeckoService } from '../services/coingecko.service';
import { PortfolioAthFunFact } from '../types';

const ATH_LOOKBACK_DAYS = 365; // Look back 1 year for ATH
const TOP_HOLDINGS_COUNT = 20; // Top 20 holdings (~98% portfolio coverage)
const MIN_VALUE_USD = 50; // Minimum $50 USD value to include

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
    const supportedChainsSet = new Set(["ethereum","arbitrum","polygon","base","optimism"]);

    // Filter out ETH/native tokens and small holdings
    const tokenHoldings = holdings.filter(
      (holding) =>
        holding.token_address &&
        holding.token_address.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' &&
        holding.token_address.toLowerCase() !== '0x000000000000000000000000000000000000800a' && // ZkSync ETH
        holding.chain &&
        supportedChainsSet.has(holding.chain) &&
        holding.value_usd >= MIN_VALUE_USD // Filter out dust
    );

    console.log(`📊 Analyzing top ${tokenHoldings.length} holdings (min $${MIN_VALUE_USD} value)`);

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
        // Calculate token amount - use balance if available, otherwise calculate from value/price
        let tokenAmount: number;
        
        if (holding.balance) {
          tokenAmount = parseFloat(holding.balance);
        } else if (holding.price_usd && holding.price_usd > 0) {
          // Calculate balance from value and price
          tokenAmount = holding.value_usd / holding.price_usd;
        } else {
          console.warn(`⚠️  Cannot calculate balance for ${holding.token_symbol}`);
          athValue += holding.value_usd; // Use current value as fallback
          continue;
        }

        // Validate token amount
        if (isNaN(tokenAmount) || tokenAmount <= 0) {
          console.warn(`⚠️  Invalid balance for ${holding.token_symbol}: ${tokenAmount}`);
          athValue += holding.value_usd; // Use current value as fallback
          continue;
        }

        // Calculate value at ATH
        const athTokenValue = tokenAmount * athData.athPrice;
        
        // Validate result
        if (isNaN(athTokenValue) || athTokenValue < 0) {
          console.warn(`⚠️  Invalid ATH calculation for ${holding.token_symbol}`);
          athValue += holding.value_usd; // Use current value as fallback
        } else {
          athValue += athTokenValue;
          successfulTokens++;
        }
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

    console.log(`✅ Successfully retrieved ATH data for ${successfulTokens}/${tokenHoldings.length} tokens`);

    // Step 5: Calculate potential gain
    const potentialGainPercent = ((athValue - currentValue) / currentValue) * 100;

    return {
      type: 'portfolio_ath',
      success: true,
      data: {
        currentValue,
        athValue,
        potentialGainPercent,
        sampleSize: tokenHoldings.length,
        successfulTokens,
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

