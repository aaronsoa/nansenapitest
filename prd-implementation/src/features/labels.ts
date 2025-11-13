import { nansenService } from '../services/nansen.service';
import { LabelsFunFact } from '../types';
import { LABEL_PRIORITY } from '../constants/labels';

/**
 * Identifies wallet labels/tags from Nansen
 * 
 * PRD Compliance:
 * - Uses `/api/beta/profiler/address/labels` endpoint
 * - Exact string matching against 35-label priority list
 * - Returns highest priority label (first match in LABEL_PRIORITY array)
 * - Fallback: null (skip card)
 * 
 * Algorithm:
 * 1. Fetch all labels from Nansen API
 * 2. Extract exact label strings from response
 * 3. Loop through LABEL_PRIORITY array in order
 * 4. Return first matching label (exact match only)
 * 5. If no match, return null
 * 
 * Based on official Nansen API documentation:
 * https://docs.nansen.ai/api/profiler/address-labels
 * 
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

    // Extract exact label strings from API response
    // API returns: [{ label: "30D Smart Trader", category: "smart_money", ... }]
    const apiLabelStrings = response.map((item) => item.label);

    // Find first match from priority list using exact string comparison
    // This ensures we get the highest priority label that matches
    for (const priorityLabel of LABEL_PRIORITY) {
      if (apiLabelStrings.includes(priorityLabel)) {
        return {
          type: 'labels',
          success: true,
          data: {
            label: priorityLabel,
          },
        };
      }
    }

    // No priority labels found - return null to skip card
    return {
      type: 'labels',
      success: false,
      fallback: null,
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

