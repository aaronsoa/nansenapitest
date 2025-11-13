import axios, { AxiosInstance } from 'axios';
import { format } from 'date-fns';
import {
  HistoricalPriceResponse,
  CurrentPriceResponse,
  MarketChartResponse,
} from '../types';

export class CoinGeckoService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.coingecko.com/api/v3',
      timeout: 30000, // 30 second timeout
    });
  }

  /**
   * Get historical price for a coin on a specific date
   * @param coinId - The CoinGecko coin ID (e.g., 'ethereum')
   * @param date - The date to get price for
   * @returns Historical price data
   */
  async getHistoricalPrice(coinId: string, date: Date): Promise<number> {
    try {
      // Format date as dd-mm-yyyy (CoinGecko requirement)
      const dateStr = format(date, 'dd-MM-yyyy');
      
      const response = await this.client.get<HistoricalPriceResponse>(
        `/coins/${coinId}/history`,
        {
          params: {
            date: dateStr,
            localization: false,
          },
        }
      );

      return response.data.market_data?.current_price?.usd || 0;
    } catch (error) {
      this.handleError('getHistoricalPrice', error);
      // Return 0 instead of throwing to allow graceful degradation
      return 0;
    }
  }

  /**
   * Get current price for one or more coins
   * @param coinIds - Array of CoinGecko coin IDs or a single ID
   * @returns Current price data
   */
  async getCurrentPrice(coinIds: string | string[]): Promise<CurrentPriceResponse> {
    try {
      const ids = Array.isArray(coinIds) ? coinIds.join(',') : coinIds;
      
      const response = await this.client.get<CurrentPriceResponse>(
        '/simple/price',
        {
          params: {
            ids,
            vs_currencies: 'usd',
          },
        }
      );

      return response.data;
    } catch (error) {
      this.handleError('getCurrentPrice', error);
      throw error;
    }
  }

  /**
   * Get market chart data for a token (price history over time)
   * @param chain - The blockchain (e.g., 'ethereum')
   * @param tokenAddress - The token contract address
   * @param days - Number of days of history to fetch
   * @returns Market chart data with prices over time
   */
  async getMarketChart(
    chain: string,
    tokenAddress: string,
    days: number
  ): Promise<MarketChartResponse> {
    try {
      // Map chain names to CoinGecko platform IDs
      const platformMap: Record<string, string> = {
        ethereum: 'ethereum',
        polygon: 'polygon-pos',
        bnb: 'binance-smart-chain',
        bsc: 'binance-smart-chain',
        arbitrum: 'arbitrum-one',
        avalanche: 'avalanche',
        optimism: 'optimistic-ethereum',
      };

      const platform = platformMap[chain.toLowerCase()] || chain.toLowerCase();
      
      const response = await this.client.get<MarketChartResponse>(
        `/coins/${platform}/contract/${tokenAddress}/market_chart`,
        {
          params: {
            vs_currency: 'usd',
            days: days.toString(),
          },
        }
      );

      return response.data;
    } catch (error) {
      this.handleError('getMarketChart', error);
      // Return empty data instead of throwing to allow graceful degradation
      return {
        prices: [],
        market_caps: [],
        total_volumes: [],
      };
    }
  }

  /**
   * Get ATH (All-Time High) price from market chart data
   * @param chain - The blockchain
   * @param tokenAddress - The token contract address
   * @param days - Number of days to look back (default: 365)
   * @returns The ATH price and when it occurred
   */
  async getATHPrice(
    chain: string,
    tokenAddress: string,
    days: number = 365
  ): Promise<{ athPrice: number; athDate: Date | null }> {
    try {
      const chartData = await this.getMarketChart(chain, tokenAddress, days);

      if (!chartData.prices || chartData.prices.length === 0) {
        return { athPrice: 0, athDate: null };
      }

      // Find the maximum price
      let maxPrice = 0;
      let maxTimestamp = 0;

      for (const [timestamp, price] of chartData.prices) {
        if (price > maxPrice) {
          maxPrice = price;
          maxTimestamp = timestamp;
        }
      }

      return {
        athPrice: maxPrice,
        athDate: maxTimestamp > 0 ? new Date(maxTimestamp) : null,
      };
    } catch (error) {
      this.handleError('getATHPrice', error);
      return { athPrice: 0, athDate: null };
    }
  }

  /**
   * Batch get ATH prices for multiple tokens
   * @param tokens - Array of token objects with chain and address
   * @param days - Number of days to look back
   * @returns Map of token addresses to ATH prices
   */
  async batchGetATHPrices(
    tokens: Array<{ chain: string; address: string }>,
    days: number = 365
  ): Promise<Map<string, { athPrice: number; athDate: Date | null }>> {
    const results = new Map<string, { athPrice: number; athDate: Date | null }>();

    // Process in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      const promises = batch.map(async (token) => {
        const ath = await this.getATHPrice(token.chain, token.address, days);
        return { address: token.address.toLowerCase(), ath };
      });

      const batchResults = await Promise.all(promises);
      batchResults.forEach(({ address, ath }) => {
        results.set(address, ath);
      });

      // Add delay between batches to respect rate limits
      if (i + batchSize < tokens.length) {
        await this.delay(1000); // 1 second delay
      }
    }

    return results;
  }

  /**
   * Utility function to add delay
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Handle and log errors from API calls
   * @param methodName - Name of the method that errored
   * @param error - The error object
   */
  private handleError(methodName: string, error: any): void {
    if (axios.isAxiosError(error)) {
      console.error(`[CoinGecko ${methodName}] API Error:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
    } else {
      console.error(`[CoinGecko ${methodName}] Unexpected Error:`, error);
    }
  }
}

// Export a singleton instance
export const coinGeckoService = new CoinGeckoService();

