/**
 * CoinMarketCap API Service
 * 
 * Alternative price data provider with better rate limits than CoinGecko free tier.
 * 
 * Free Tier:
 * - 333 calls/day (10,000 calls/month)
 * - Basic plan with API key required
 * - Good for historical and current prices
 * 
 * Documentation: https://coinmarketcap.com/api/documentation/v1/
 * 
 * Usage:
 * 1. Sign up at https://coinmarketcap.com/api/
 * 2. Get free API key
 * 3. Add COINMARKETCAP_API_KEY to .env
 * 4. Service will automatically be available as fallback
 */

import axios, { AxiosInstance } from 'axios';

interface CoinMarketCapQuote {
  price: number;
  volume_24h: number;
  percent_change_24h: number;
  market_cap: number;
}

interface CoinMarketCapHistoricalQuote {
  timestamp: string;
  quote: {
    USD: CoinMarketCapQuote;
  };
}

interface CoinMarketCapCurrentPriceResponse {
  data: {
    [symbol: string]: {
      id: number;
      name: string;
      symbol: string;
      quote: {
        USD: CoinMarketCapQuote;
      };
    };
  };
}

interface CoinMarketCapHistoricalResponse {
  data: {
    quotes: CoinMarketCapHistoricalQuote[];
  };
}

export class CoinMarketCapService {
  private client: AxiosInstance;
  private apiKey: string;
  private isConfigured: boolean;

  constructor() {
    this.apiKey = process.env.COINMARKETCAP_API_KEY || '';
    this.isConfigured = this.apiKey.length > 0;

    if (!this.isConfigured) {
      console.warn('[CoinMarketCap] API key not configured - service disabled');
    }

    this.client = axios.create({
      baseURL: 'https://pro-api.coinmarketcap.com/v1',
      headers: {
        'X-CMC_PRO_API_KEY': this.apiKey,
        Accept: 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });
  }

  /**
   * Check if CoinMarketCap service is configured
   */
  isEnabled(): boolean {
    return this.isConfigured;
  }

  /**
   * Get current price for a cryptocurrency
   * @param symbol - Cryptocurrency symbol (e.g., 'ETH', 'BTC')
   * @returns Current price in USD
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    if (!this.isConfigured) {
      throw new Error('CoinMarketCap API key not configured');
    }

    try {
      const response = await this.client.get<CoinMarketCapCurrentPriceResponse>(
        '/cryptocurrency/quotes/latest',
        {
          params: {
            symbol: symbol.toUpperCase(),
          },
        }
      );

      const data = response.data.data[symbol.toUpperCase()];
      if (data && data.quote && data.quote.USD) {
        return data.quote.USD.price;
      }

      return 0;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('[CoinMarketCap] Error fetching current price:', error.response?.data || error.message);
      } else {
        console.error('[CoinMarketCap] Error fetching current price:', error);
      }
      return 0;
    }
  }

  /**
   * Get historical price for a cryptocurrency on a specific date
   * @param symbol - Cryptocurrency symbol (e.g., 'ETH', 'BTC')
   * @param date - Date to get price for
   * @returns Historical price in USD
   */
  async getHistoricalPrice(symbol: string, date: Date): Promise<number> {
    if (!this.isConfigured) {
      throw new Error('CoinMarketCap API key not configured');
    }

    try {
      // CoinMarketCap requires timestamps in ISO format
      const timestamp = date.toISOString();

      const response = await this.client.get<CoinMarketCapHistoricalResponse>(
        '/cryptocurrency/quotes/historical',
        {
          params: {
            symbol: symbol.toUpperCase(),
            time_start: timestamp,
            time_end: timestamp,
          },
        }
      );

      if (response.data.data?.quotes && response.data.data.quotes.length > 0) {
        const quote = response.data.data.quotes[0];
        return quote.quote.USD.price;
      }

      return 0;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('[CoinMarketCap] Error fetching historical price:', error.response?.data || error.message);
      } else {
        console.error('[CoinMarketCap] Error fetching historical price:', error);
      }
      return 0;
    }
  }

  /**
   * Get symbol from token address (mapping helper)
   * 
   * Note: CoinMarketCap uses symbols, not contract addresses
   * This is a limitation - you'll need to maintain a mapping
   * or use CoinGecko for address-based lookups
   * 
   * @param chain - Blockchain name
   * @param address - Token contract address
   * @returns Token symbol if known, null otherwise
   */
  getSymbolFromAddress(chain: string, address: string): string | null {
    // Simple mapping for common tokens
    // In production, you'd want a more comprehensive mapping
    const commonTokens: { [key: string]: string } = {
      // Ethereum mainnet
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': 'WETH',
      '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT',
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC',
      '0x6b175474e89094c44da98b954eedeac495271d0f': 'DAI',
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'WBTC',
      '0x514910771af9ca656af840dff83e8264ecf986ca': 'LINK',
      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': 'UNI',
      '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0': 'MATIC',
      // Add more as needed
    };

    return commonTokens[address.toLowerCase()] || null;
  }
}

// Export singleton instance
export const coinMarketCapService = new CoinMarketCapService();

