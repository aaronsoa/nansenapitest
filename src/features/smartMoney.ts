import { nansenService } from '../services/nansen.service';
import { SmartMoneyFunFact } from '../types';

// Smart money labels to look for
const SMART_MONEY_LABELS = [
  'Smart Money',
  'Professional Trader',
  'Quant Trader',
  'Institutional Investor',
  'Fund',
  'Whale',
];

/**
 * Identifies if wallet belongs to smart money/professional traders
 * @param address - Wallet address to analyze
 * @returns Smart Money Fun Fact
 */
export async function analyzeSmartMoney(address: string): Promise<SmartMoneyFunFact> {
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
        type: 'smart_money',
        success: false,
        fallback: null,
      };
    }

    // Extract label names
    const labelNames = response.map((label) => label.label);

    // Find smart money labels (exact match only to avoid false positives)
    const smartMoneyLabelsFound: string[] = [];

    for (const label of labelNames) {
      const isSmartMoney = SMART_MONEY_LABELS.some(
        (smartLabel) => label.toLowerCase() === smartLabel.toLowerCase()
      );

      if (isSmartMoney) {
        smartMoneyLabelsFound.push(label);
      }
    }

    // If no smart money labels found, return null
    if (smartMoneyLabelsFound.length === 0) {
      return {
        type: 'smart_money',
        success: false,
        fallback: null,
      };
    }

    return {
      type: 'smart_money',
      success: true,
      data: {
        isSmartMoney: true,
        labels: smartMoneyLabelsFound,
      },
    };
  } catch (error) {
    console.error('Error analyzing smart money:', error);
    return {
      type: 'smart_money',
      success: false,
      fallback: null,
    };
  }
}

