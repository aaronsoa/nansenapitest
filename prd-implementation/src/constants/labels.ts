/**
 * Label Priority List - PRD Compliant
 * 
 * This list defines the exact priority order for wallet labels as specified in the PRD.
 * Labels are matched against Nansen API responses using exact string comparison.
 * The first matching label in this priority order will be returned.
 * 
 * Based on:
 * - PRD specifications
 * - Official Nansen documentation: https://docs.nansen.ai/api/profiler/address-labels
 * - Official label guide: https://www.nansen.ai/guides/wallet-labels-emojis-what-do-they-mean
 */

export const LABEL_PRIORITY = [
  // Priority 1-5: Top tier traders and wealth indicators
  'Top 100 Leaderboard Trader',
  'Multiple Memecoin Whales',
  'Memecoin Whale',
  'Smart Fund',
  'Token Millionaire',
  
  // Priority 6-12: Wealth indicators and sector specialists
  'ETH Millionaire',
  'New Token Specialist',
  'Memecoin Specialist',
  'Gaming Specialist',
  'AI Specialist',
  'DEX Specialist',
  'RWA Specialist',
  
  // Priority 13-16: NFT Smart Money
  'Smart NFT Trader',
  'Smart NFT Collector',
  'Smart NFT Minter',
  'Smart NFT Early Adopter',
  
  // Priority 17-19: Emerging traders and token deployers
  'Top Token Deployer',
  'Token Deployer',
  'Emerging Smart Trader',
  
  // Priority 20-31: Chain specialists
  'Arbitrum Specialist',
  'Base Specialist',
  'Blast Specialist',
  'Optimism Specialist',
  'Polygon Specialist',
  'Linea Specialist',
  'Scroll Specialist',
  'Fantom Specialist',
  'Sei Specialist',
  'ZKsync Specialist',
  'BSC Specialist',
  'Avalanche Specialist',
  
  // Priority 32-35: DeFi users and trading behavior
  'Staker',
  'OpenSea User',
  'Blur Trader',
  'Exit Liquidity',
];

/**
 * Smart Money Priority List
 * 
 * Smart money labels with timeframe indicators, in priority order.
 * These labels can be identified by:
 * 1. Checking the label's category === 'smart_money' (from API response)
 * 2. Or by exact string matching against this list
 */
export const SMART_MONEY_PRIORITY = [
  'Smart Trader (2Y)',
  '180D Smart Trader',
  '90D Smart Trader',
  '30D Smart Trader',
];

/**
 * Additional smart money indicators that may appear in labels
 */
export const SMART_MONEY_KEYWORDS = [
  'Smart Fund',
  'Smart NFT Trader',
  'Smart NFT Collector',
  'Smart NFT Minter',
  'Smart NFT Early Adopter',
];

/**
 * Label Categories (from official Nansen API documentation)
 */
export enum LabelCategory {
  BEHAVIORAL = 'behavioral',
  SMART_MONEY = 'smart_money',
  DEFI = 'defi',
  SOCIAL = 'social',
  OTHERS = 'others',
}

