import { subYears } from 'date-fns';
import { nansenService } from '../services/nansen.service';
import { PnlFunFact } from '../types';

/**
 * Analyzes wallet's realized profit/loss over the past year
 * @param address - Wallet address to analyze
 * @param years - Number of years to look back (default: 1)
 * @returns P&L Fun Fact
 */
export async function analyzePnl(address: string, years: number = 1): Promise<PnlFunFact> {
  try {
    const now = new Date();
    const fromDate = subYears(now, years);

    const response = await nansenService.getPnlSummary({
      address,
      chain: 'all',
      date: {
        from: fromDate.toISOString(),
        to: now.toISOString(),
      },
    });

    // Check if we have valid data
    if (!response || response.realized_pnl_usd === undefined) {
      return {
        type: 'pnl',
        success: false,
        fallback: 'Only mist—too little history to read.',
      };
    }

    // Nansen returns decimal format (e.g., 0.15 for 15%), convert to percentage
    const pnlPercent = response.realized_pnl_percent * 100;
    const pnlUsd = response.realized_pnl_usd;

    // If both values are 0 or very close to 0, consider it insufficient history
    if (Math.abs(pnlPercent) < 0.01 && Math.abs(pnlUsd) < 1) {
      return {
        type: 'pnl',
        success: false,
        fallback: 'Only mist—too little history to read.',
      };
    }

    return {
      type: 'pnl',
      success: true,
      data: {
        realized_pnl_percent: pnlPercent,
        realized_pnl_usd: pnlUsd,
        status: pnlPercent >= 0 ? 'GAIN' : 'LOSS',
        timeframe: years === 1 ? 'in the past year' : `in the past ${years} years`,
      },
    };
  } catch (error) {
    console.error('Error analyzing P&L:', error);
    return {
      type: 'pnl',
      success: false,
      fallback: 'Only mist—too little history to read.',
    };
  }
}

