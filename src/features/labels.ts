import { nansenService } from '../services/nansen.service';
import { LabelsFunFact } from '../types';

// Official Nansen Label Priority List (highest to lowest priority)
// Based on: https://www.nansen.ai/guides/wallet-labels-emojis-what-do-they-mean
const LABEL_PRIORITY = [
  'Top 100 Leaderboard Trader',      // Priority 1
  'Multiple Memecoin Whales',        // Priority 2
  'Memecoin Whale',                  // Priority 3
  'Smart Fund',                      // Priority 4
  'Token Millionaire',               // Priority 5
  'ETH Millionaire',                 // Priority 6
  'New Token Specialist',            // Priority 7
  'Memecoin Specialist',             // Priority 8
  'Gaming Specialist',               // Priority 9
  'AI Specialist',                   // Priority 10
  'DEX Specialist',                  // Priority 11
  'RWA Specialist',                  // Priority 12
  'Smart NFT Trader',                // Priority 13
  'Smart NFT Collector',             // Priority 14
  'Smart NFT Minter',                // Priority 15
  'Smart NFT Early Adopter',         // Priority 16
  'Top Token Deployer',              // Priority 17
  'Token Deployer',                  // Priority 18
  'Emerging Smart Trader',           // Priority 19
  'Arbitrum Specialist',             // Priority 20
  'Base Specialist',                 // Priority 21
  'Blast Specialist',                // Priority 22
  'Optimism Specialist',             // Priority 23
  'Polygon Specialist',              // Priority 24
  'Linea Specialist',                // Priority 25
  'Scroll Specialist',               // Priority 26
  'Fantom Specialist',               // Priority 27
  'Sei Specialist',                  // Priority 28
  'ZKsync Specialist',               // Priority 29
  'BSC Specialist',                  // Priority 30
  'Avalanche Specialist',            // Priority 31
  'Staker',                          // Priority 32
  'OpenSea User',                    // Priority 33
  'Blur Trader',                     // Priority 34
  'Exit Liquidity',                  // Priority 35
];

/**
 * Identifies wallet labels/tags from Nansen
 * @param address - Wallet address to analyze
 * @returns Labels Fun Fact
 */
export async function analyzeLabels(address: string): Promise<LabelsFunFact> {
  try {
    const response = await nansenService.getLabels({
      parameters: {
        chain: 'all',
        address,
      },
      pagination: {
        page: 1,
        recordsPerPage: 100,
      },
    });

    // Check if we have any labels (response is a direct array)
    if (!response || !Array.isArray(response) || response.length === 0) {
      return {
        type: 'labels',
        success: false,
        fallback: null,
      };
    }

    // Extract label names
    const labelNames = response.map((label) => label.label);
    
    console.log(`  Found ${labelNames.length} label(s) for address: ${labelNames.join(', ')}`);

    // Find the highest priority label using improved matching logic
    let highestPriorityLabel: string | null = null;
    let highestPriorityIndex = LABEL_PRIORITY.length;
    let actualLabel: string | null = null;

    for (const label of labelNames) {
      // Try exact match first
      const exactMatch = LABEL_PRIORITY.findIndex(
        (priorityLabel) => label === priorityLabel
      );

      if (exactMatch !== -1 && exactMatch < highestPriorityIndex) {
        highestPriorityIndex = exactMatch;
        highestPriorityLabel = LABEL_PRIORITY[exactMatch];
        actualLabel = label;
        continue;
      }

      // Try partial match for variants (e.g., "30D Smart Trader" matches "Emerging Smart Trader")
      const partialMatch = LABEL_PRIORITY.findIndex(
        (priorityLabel) => {
          // Handle time-based variants (30D, 90D, 180D, etc.)
          const labelWithoutTime = label.replace(/^\d+D\s+/, '');
          
          // Check if core label matches
          if (labelWithoutTime === priorityLabel) return true;
          
          // Handle chain-specific variants (e.g., "Smart Trader (Ethereum)")
          const labelWithoutChain = label.replace(/\s*\([^)]+\)\s*$/, '');
          if (labelWithoutChain === priorityLabel) return true;
          
          // Handle "Smart Trader" variants mapping to "Emerging Smart Trader"
          if (priorityLabel === 'Emerging Smart Trader' && 
              (label.includes('Smart Trader') || label.includes('Smart Money'))) {
            return true;
          }
          
          return false;
        }
      );

      if (partialMatch !== -1 && partialMatch < highestPriorityIndex) {
        highestPriorityIndex = partialMatch;
        highestPriorityLabel = LABEL_PRIORITY[partialMatch];
        actualLabel = label;
      }
    }

    // If no priority label found, return the first label as fallback
    if (!highestPriorityLabel) {
      console.log(`  No priority label matched. Using first label: ${labelNames[0]}`);
      return {
        type: 'labels',
        success: true,
        data: {
          label: labelNames[0], // Use the actual label from Nansen
        },
      };
    }

    console.log(`  Selected label: "${actualLabel}" (Priority ${highestPriorityIndex + 1}: ${highestPriorityLabel})`);

    return {
      type: 'labels',
      success: true,
      data: {
        label: actualLabel || highestPriorityLabel, // Use actual label if available, otherwise use priority label
      },
    };
  } catch (error) {
    console.error('Error analyzing labels:', error);
    return {
      type: 'labels',
      success: false,
      fallback: null,
    };
  }
}

