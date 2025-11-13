import { subYears } from 'date-fns';
import { nansenService } from '../services/nansen.service';
import { RuggedProjectsFunFact } from '../types';

const LIQUIDITY_THRESHOLD = 10000; // $10,000 USD
const MIN_VALUE_USD = 5; // Minimum $5 USD holdings

/**
 * Detects if wallet holds tokens in rugged/scam projects
 * @param address - Wallet address to analyze
 * @returns Rugged Projects Fun Fact
 */
export async function analyzeRuggedProjects(address: string): Promise<RuggedProjectsFunFact> {
  try {
    // Step 1: Fetch current holdings (tokens > $5 USD)
    const balanceResponse = await nansenService.getCurrentBalance({
      address,
      chain: 'all',
      hide_spam_token: true,
      filters: {
        value_usd: {
          min: MIN_VALUE_USD,
        },
      },
      pagination: {
        page: 1,
        per_page: 100,
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
        type: 'rugged_projects',
        success: true,
        data: {
          ruggedCount: 0,
          ruggedTokens: [],
        },
        fallback: 'No rugged projects detected—clear skies ahead',
      };
    }

    const holdings = balanceResponse.data;

    // Step 2: Screen tokens for low liquidity (potential rugs)
    const now = new Date();
    const fromDate = subYears(now, 1);

    // Filter out ETH and native tokens (they can't be rugged)
    const tokenAddresses = holdings
      .filter((holding) => 
        holding.token_address && 
        holding.token_address.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
      )
      .map((holding) => holding.token_address);

    if (tokenAddresses.length === 0) {
      return {
        type: 'rugged_projects',
        success: true,
        data: {
          ruggedCount: 0,
          ruggedTokens: [],
        },
        fallback: 'No rugged projects detected—clear skies ahead',
      };
    }

    // Screen tokens for low liquidity
    const screenerResponse = await nansenService.screenTokens({
      chains: ['ethereum', 'polygon', 'bnb', 'arbitrum', 'avalanche'],
      date: {
        from: fromDate.toISOString(),
        to: now.toISOString(),
      },
      watchlistFilter: tokenAddresses,
      filters: {
        liquidity: {
          from: 0,
          to: LIQUIDITY_THRESHOLD,
        },
      },
      pagination: {
        page: 1,
        per_page: 100,
      },
      order: {
        orderBy: 'liquidity',
        order: 'asc',
      },
    });

    // Identify rugged tokens (low liquidity)
    const ruggedTokens = screenerResponse.data?.items || [];

    if (ruggedTokens.length === 0) {
      return {
        type: 'rugged_projects',
        success: true,
        data: {
          ruggedCount: 0,
          ruggedTokens: [],
        },
        fallback: 'No rugged projects detected—clear skies ahead',
      };
    }

    // Map rugged tokens with their details
    const ruggedTokenDetails = ruggedTokens.map((token) => ({
      name: token.token_name,
      symbol: token.token_symbol,
      liquidity: token.liquidity_usd || token.liquidity,
    }));

    return {
      type: 'rugged_projects',
      success: true,
      data: {
        ruggedCount: ruggedTokens.length,
        ruggedTokens: ruggedTokenDetails,
      },
    };
  } catch (error) {
    console.error('Error analyzing rugged projects:', error);
    return {
      type: 'rugged_projects',
      success: true,
      data: {
        ruggedCount: 0,
        ruggedTokens: [],
      },
      fallback: 'No rugged projects detected—clear skies ahead',
    };
  }
}

