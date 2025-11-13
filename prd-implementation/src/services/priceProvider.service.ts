/**
 * Price Provider Service - Abstraction Layer
 * 
 * This service provides a unified interface for fetching cryptocurrency prices
 * from multiple providers with automatic fallback support.
 * 
 * Provider Priority:
 * 1. Nansen (primary) - Uses existing transaction/balance data, no extra API calls
 * 2. CoinGecko (fallback) - Free tier with rate limits
 * 3. CoinMarketCap (optional) - Requires API key
 * 
 * Benefits:
 * - Zero additional API calls when Nansen data is available
 * - Automatic fallback if primary provider fails
 * - Easy to add new providers
 * - Consistent interface across the application
 */

import { coinGeckoService } from './coingecko.service';
import { coinMarketCapService } from './coinmarketcap.service';

/**
 * Price Provider Interface
 * All providers must implement this interface
 */
export interface PriceProvider {
  name: string;
  
  /**
   * Get historical price for a coin on a specific date
   * @param coinId - Coin identifier (e.g., 'ethereum')
   * @param date - Date to get price for
   * @returns Price in USD, or 0 if unavailable
   */
  getHistoricalPrice(coinId: string, date: Date): Promise<number>;
  
  /**
   * Get current price for a coin
   * @param coinId - Coin identifier (e.g., 'ethereum')
   * @returns Price in USD, or 0 if unavailable
   */
  getCurrentPrice(coinId: string): Promise<number>;
  
  /**
   * Get all-time high price for a token
   * @param chain - Blockchain name (e.g., 'ethereum')
   * @param address - Token contract address
   * @param days - Number of days to look back
   * @returns ATH price and date, or null values if unavailable
   */
  getATHPrice(
    chain: string,
    address: string,
    days: number
  ): Promise<{ athPrice: number; athDate: Date | null }>;
}

/**
 * Nansen Price Provider
 * 
 * Uses transaction and balance data from Nansen API
 * - No additional API calls needed
 * - Price data comes from existing transaction/balance queries
 * - Cannot provide ATH data (not available in Nansen)
 */
export class NansenPriceProvider implements PriceProvider {
  name = 'Nansen';

  /**
   * Get historical price from Nansen transaction data
   * Note: This requires having transaction data available in context
   * This provider is meant to be used when we already have the transaction data
   */
  async getHistoricalPrice(coinId: string, date: Date): Promise<number> {
    // Nansen doesn't provide standalone historical price queries
    // Prices come from transaction data (tokens_sent/tokens_received)
    // This method is a placeholder - actual price extraction happens
    // in the feature code that has access to transaction data
    return 0;
  }

  /**
   * Get current price from Nansen balance data
   * Note: This requires having balance data available in context
   */
  async getCurrentPrice(coinId: string): Promise<number> {
    // Similar to historical price, current prices come from balance queries
    // The actual price extraction happens in feature code
    // that has access to balance data
    return 0;
  }

  /**
   * Nansen cannot provide ATH data
   */
  async getATHPrice(
    chain: string,
    address: string,
    days: number
  ): Promise<{ athPrice: number; athDate: Date | null }> {
    // Nansen doesn't provide ATH data
    // Must fall back to other providers
    return { athPrice: 0, athDate: null };
  }
}

/**
 * CoinGecko Price Provider
 * 
 * Uses CoinGecko free tier API
 * - Rate limited (10-50 calls/minute)
 * - Good for fallback when Nansen data unavailable
 * - Can provide ATH data
 */
export class CoinGeckoPriceProvider implements PriceProvider {
  name = 'CoinGecko';

  async getHistoricalPrice(coinId: string, date: Date): Promise<number> {
    try {
      return await coinGeckoService.getHistoricalPrice(coinId, date);
    } catch (error) {
      console.warn(`[${this.name}] Failed to get historical price:`, error);
      return 0;
    }
  }

  async getCurrentPrice(coinId: string): Promise<number> {
    try {
      const response = await coinGeckoService.getCurrentPrice(coinId);
      return response[coinId]?.usd || 0;
    } catch (error) {
      console.warn(`[${this.name}] Failed to get current price:`, error);
      return 0;
    }
  }

  async getATHPrice(
    chain: string,
    address: string,
    days: number
  ): Promise<{ athPrice: number; athDate: Date | null }> {
    try {
      return await coinGeckoService.getATHPrice(chain, address, days);
    } catch (error) {
      console.warn(`[${this.name}] Failed to get ATH price:`, error);
      return { athPrice: 0, athDate: null };
    }
  }
}

/**
 * CoinMarketCap Price Provider
 * 
 * Uses CoinMarketCap API (requires API key)
 * - Better rate limits than CoinGecko free tier (333 calls/day)
 * - Good for historical and current prices
 * - Limited to symbol-based lookups (not contract addresses)
 * - Only available if COINMARKETCAP_API_KEY is configured
 */
export class CoinMarketCapPriceProvider implements PriceProvider {
  name = 'CoinMarketCap';

  async getHistoricalPrice(coinId: string, date: Date): Promise<number> {
    if (!coinMarketCapService.isEnabled()) {
      return 0;
    }

    try {
      // CoinMarketCap uses symbols, so we need to convert
      // coinId (e.g., 'ethereum') to symbol (e.g., 'ETH')
      const symbol = this.coinIdToSymbol(coinId);
      if (!symbol) {
        return 0;
      }

      return await coinMarketCapService.getHistoricalPrice(symbol, date);
    } catch (error) {
      console.warn(`[${this.name}] Failed to get historical price:`, error);
      return 0;
    }
  }

  async getCurrentPrice(coinId: string): Promise<number> {
    if (!coinMarketCapService.isEnabled()) {
      return 0;
    }

    try {
      const symbol = this.coinIdToSymbol(coinId);
      if (!symbol) {
        return 0;
      }

      return await coinMarketCapService.getCurrentPrice(symbol);
    } catch (error) {
      console.warn(`[${this.name}] Failed to get current price:`, error);
      return 0;
    }
  }

  async getATHPrice(
    chain: string,
    address: string,
    days: number
  ): Promise<{ athPrice: number; athDate: Date | null }> {
    // CoinMarketCap doesn't provide direct ATH endpoint
    // Would need to fetch historical data and calculate ATH
    // Not implemented for now - use CoinGecko for ATH
    return { athPrice: 0, athDate: null };
  }

  /**
   * Convert CoinGecko coin ID to CoinMarketCap symbol
   * @param coinId - CoinGecko coin ID (e.g., 'ethereum')
   * @returns CoinMarketCap symbol (e.g., 'ETH')
   */
  private coinIdToSymbol(coinId: string): string | null {
    const mapping: { [key: string]: string } = {
      ethereum: 'ETH',
      bitcoin: 'BTC',
      'binance-coin': 'BNB',
      'usd-coin': 'USDC',
      tether: 'USDT',
      'wrapped-bitcoin': 'WBTC',
      dai: 'DAI',
      chainlink: 'LINK',
      uniswap: 'UNI',
      'matic-network': 'MATIC',
      // Add more mappings as needed
    };

    return mapping[coinId.toLowerCase()] || null;
  }
}

/**
 * Price Service with Provider Fallback
 * 
 * Manages multiple price providers and automatically falls back
 * to the next provider if the current one fails or returns no data
 */
export class PriceService {
  private providers: PriceProvider[];

  constructor(providers?: PriceProvider[]) {
    if (providers) {
      this.providers = providers;
    } else {
      // Default provider chain: Nansen → CoinGecko → CoinMarketCap (if configured)
      this.providers = [
        new NansenPriceProvider(),
        new CoinGeckoPriceProvider(),
      ];

      // Add CoinMarketCap if API key is configured
      if (coinMarketCapService.isEnabled()) {
        this.providers.push(new CoinMarketCapPriceProvider());
        console.log('[PriceService] CoinMarketCap provider enabled');
      }
    }
  }

  /**
   * Get historical price with automatic provider fallback
   * @param coinId - Coin identifier
   * @param date - Date to get price for
   * @returns Price in USD, or 0 if all providers fail
   */
  async getHistoricalPrice(coinId: string, date: Date): Promise<number> {
    for (const provider of this.providers) {
      try {
        const price = await provider.getHistoricalPrice(coinId, date);
        if (price > 0) {
          console.log(`[PriceService] Got historical price from ${provider.name}: $${price.toFixed(2)}`);
          return price;
        }
      } catch (error) {
        console.warn(`[PriceService] ${provider.name} failed, trying next provider...`);
      }
    }
    
    console.warn('[PriceService] All providers failed for historical price');
    return 0;
  }

  /**
   * Get current price with automatic provider fallback
   * @param coinId - Coin identifier
   * @returns Price in USD, or 0 if all providers fail
   */
  async getCurrentPrice(coinId: string): Promise<number> {
    for (const provider of this.providers) {
      try {
        const price = await provider.getCurrentPrice(coinId);
        if (price > 0) {
          console.log(`[PriceService] Got current price from ${provider.name}: $${price.toFixed(2)}`);
          return price;
        }
      } catch (error) {
        console.warn(`[PriceService] ${provider.name} failed, trying next provider...`);
      }
    }
    
    console.warn('[PriceService] All providers failed for current price');
    return 0;
  }

  /**
   * Get ATH price with automatic provider fallback
   * @param chain - Blockchain name
   * @param address - Token contract address
   * @param days - Number of days to look back
   * @returns ATH price and date, or null values if all providers fail
   */
  async getATHPrice(
    chain: string,
    address: string,
    days: number
  ): Promise<{ athPrice: number; athDate: Date | null }> {
    for (const provider of this.providers) {
      try {
        const result = await provider.getATHPrice(chain, address, days);
        if (result.athPrice > 0) {
          console.log(`[PriceService] Got ATH price from ${provider.name}: $${result.athPrice.toFixed(2)}`);
          return result;
        }
      } catch (error) {
        console.warn(`[PriceService] ${provider.name} failed, trying next provider...`);
      }
    }
    
    console.warn('[PriceService] All providers failed for ATH price');
    return { athPrice: 0, athDate: null };
  }

  /**
   * Batch get ATH prices for multiple tokens
   * Uses the first available provider that supports batch operations
   * 
   * @param tokens - Array of tokens to fetch ATH for
   * @param days - Number of days to look back
   * @returns Map of token addresses to ATH data
   */
  async batchGetATHPrices(
    tokens: Array<{ chain: string; address: string }>,
    days: number = 365
  ): Promise<Map<string, { athPrice: number; athDate: Date | null }>> {
    // Currently only CoinGecko supports batch operations
    // Nansen doesn't provide ATH data
    const coinGeckoProvider = this.providers.find(
      (p) => p.name === 'CoinGecko'
    ) as CoinGeckoPriceProvider;

    if (coinGeckoProvider) {
      try {
        return await coinGeckoService.batchGetATHPrices(tokens, days);
      } catch (error) {
        console.error('[PriceService] Batch ATH fetch failed:', error);
        return new Map();
      }
    }

    // Fallback: fetch one by one
    const results = new Map<string, { athPrice: number; athDate: Date | null }>();
    for (const token of tokens) {
      const ath = await this.getATHPrice(token.chain, token.address, days);
      results.set(token.address.toLowerCase(), ath);
    }
    return results;
  }
}

// Export singleton instance
export const priceService = new PriceService();

