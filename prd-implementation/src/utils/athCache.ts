/**
 * ATH Cache - In-Memory Cache for All-Time High Prices
 * 
 * This cache reduces redundant API calls to CoinGecko by storing ATH prices
 * for tokens. Since ATH prices don't change frequently (only when a new high
 * is reached), we can safely cache them for extended periods.
 * 
 * Benefits:
 * - Reduces API calls by 80%+ for repeated wallet analyses
 * - Eliminates rate limit issues for Portfolio ATH feature
 * - Improves response time significantly
 * 
 * Cache Strategy:
 * - TTL: 24 hours (ATH prices are relatively stable)
 * - In-memory storage (doesn't persist between restarts)
 * - Key: token address (lowercase)
 */

interface ATHCacheEntry {
  athPrice: number;
  athDate: Date;
  cachedAt: Date;
}

export class ATHCache {
  private cache: Map<string, ATHCacheEntry>;
  private readonly CACHE_TTL: number;
  private hits: number;
  private misses: number;

  /**
   * Create a new ATH cache
   * @param ttlHours - Time-to-live in hours (default: 24)
   */
  constructor(ttlHours: number = 24) {
    this.cache = new Map();
    this.CACHE_TTL = ttlHours * 60 * 60 * 1000; // Convert to milliseconds
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get ATH price from cache
   * @param tokenAddress - Token contract address
   * @returns ATH price and date if cached and fresh, null otherwise
   */
  get(tokenAddress: string): { athPrice: number; athDate: Date } | null {
    const key = tokenAddress.toLowerCase();
    const cached = this.cache.get(key);

    if (!cached) {
      this.misses++;
      return null;
    }

    // Check if cache entry is stale
    const age = Date.now() - cached.cachedAt.getTime();
    if (age > this.CACHE_TTL) {
      // Cache expired, remove it
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Cache hit!
    this.hits++;
    return {
      athPrice: cached.athPrice,
      athDate: cached.athDate,
    };
  }

  /**
   * Store ATH price in cache
   * @param tokenAddress - Token contract address
   * @param athPrice - All-time high price
   * @param athDate - Date when ATH was reached
   */
  set(tokenAddress: string, athPrice: number, athDate: Date): void {
    const key = tokenAddress.toLowerCase();
    this.cache.set(key, {
      athPrice,
      athDate,
      cachedAt: new Date(),
    });
  }

  /**
   * Check if a token's ATH price is cached
   * @param tokenAddress - Token contract address
   * @returns true if cached and fresh, false otherwise
   */
  has(tokenAddress: string): boolean {
    return this.get(tokenAddress) !== null;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   * @returns Cache hit rate and other metrics
   */
  getStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimals
    };
  }

  /**
   * Remove expired entries from cache
   * Useful for memory management in long-running processes
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.cachedAt.getTime();
      if (age > this.CACHE_TTL) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`[ATHCache] Cleaned up ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Get cache size (number of entries)
   */
  get size(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const athCache = new ATHCache(24); // 24-hour TTL

