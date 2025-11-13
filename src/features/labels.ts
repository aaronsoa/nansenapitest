import { nansenService } from '../services/nansen.service';
import { LabelsFunFact } from '../types';

// Label priority list (highest to lowest priority)
const LABEL_PRIORITY = [
  'Whale',
  'Smart Money',
  'Professional Trader',
  'Quant Trader',
  'MEV Bot',
  'Bot',
  'Active Trader',
  'High Activity',
  'Dex Trader',
  'NFT Collector',
  'ENS Domains Collector',
  'Staker',
  'DeFi User',
  'OpenSea User',
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

    // Find the highest priority label
    let highestPriorityLabel: string | null = null;
    let highestPriorityIndex = LABEL_PRIORITY.length;

    for (const label of labelNames) {
      const priorityIndex = LABEL_PRIORITY.findIndex(
        (priorityLabel) => label.toLowerCase().includes(priorityLabel.toLowerCase())
      );

      if (priorityIndex !== -1 && priorityIndex < highestPriorityIndex) {
        highestPriorityIndex = priorityIndex;
        highestPriorityLabel = LABEL_PRIORITY[priorityIndex];
      }
    }

    // If no priority label found, return null
    if (!highestPriorityLabel) {
      return {
        type: 'labels',
        success: false,
        fallback: null,
      };
    }

    return {
      type: 'labels',
      success: true,
      data: {
        label: highestPriorityLabel,
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

