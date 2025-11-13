import { nansenService } from '../services/nansen.service';
import { SmartMoneyFunFact } from '../types';
import { SMART_MONEY_PRIORITY, SMART_MONEY_KEYWORDS, LabelCategory } from '../constants/labels';

/**
 * Identifies if wallet belongs to smart money/professional traders
 * 
 * PRD Compliance:
 * - Uses `/api/beta/profiler/address/labels` endpoint
 * - Filters by category === 'smart_money' OR matches smart money keywords
 * - Priority: Smart Trader (2Y) > 180D > 90D > 30D
 * - Fallback: null (skip card)
 * 
 * Two detection approaches (both used):
 * 1. Category-based: Filter labels with category === 'smart_money'
 * 2. Keyword-based: Match against SMART_MONEY_PRIORITY + SMART_MONEY_KEYWORDS
 * 
 * Based on official Nansen API documentation:
 * https://docs.nansen.ai/api/profiler/address-labels
 * 
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

    // Approach 1: Category-based detection (recommended by official docs)
    // Filter labels with category === 'smart_money'
    const smartMoneyLabels = response.filter(
      (item) => item.category === LabelCategory.SMART_MONEY
    );

    // If we found smart money category labels, check priority
    if (smartMoneyLabels.length > 0) {
      const smartMoneyLabelStrings = smartMoneyLabels.map((item) => item.label);

      // Check priority order
      for (const priorityLabel of SMART_MONEY_PRIORITY) {
        if (smartMoneyLabelStrings.includes(priorityLabel)) {
          return {
            type: 'smart_money',
            success: true,
            data: {
              isSmartMoney: true,
              labels: [priorityLabel],
            },
          };
        }
      }

      // If category is smart_money but doesn't match priority list,
      // still consider it smart money
      return {
        type: 'smart_money',
        success: true,
        data: {
          isSmartMoney: true,
          labels: smartMoneyLabels.map((item) => item.label),
        },
      };
    }

    // Approach 2: Keyword-based detection (fallback)
    // Check if any label matches our smart money keywords
    const allLabelStrings = response.map((item) => item.label);

    // Check priority labels first
    for (const priorityLabel of SMART_MONEY_PRIORITY) {
      if (allLabelStrings.includes(priorityLabel)) {
        return {
          type: 'smart_money',
          success: true,
          data: {
            isSmartMoney: true,
            labels: [priorityLabel],
          },
        };
      }
    }

    // Check keyword labels
    for (const keyword of SMART_MONEY_KEYWORDS) {
      if (allLabelStrings.includes(keyword)) {
        return {
          type: 'smart_money',
          success: true,
          data: {
            isSmartMoney: true,
            labels: [keyword],
          },
        };
      }
    }

    // No smart money labels found
    return {
      type: 'smart_money',
      success: false,
      fallback: null,
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

