import { subYears, differenceInDays } from 'date-fns';
import { nansenService } from '../services/nansen.service';
import { RuggedProjectsFunFact } from '../types';

const MIN_INVESTMENT = 100; // Minimum $100 investment to consider
const LOSS_THRESHOLD = -90; // 90% loss threshold
const MIN_AGE_DAYS = 30; // Minimum 30 days since last purchase
const DEAD_PRICE_THRESHOLD = 0.00001; // Tokens with price < $0.00001 considered dead

/**
 * Detects if wallet holds tokens in rugged/scam projects
 * Uses transaction history to identify significant investments that lost 90%+ value
 * 
 * @param address - Wallet address to analyze
 * @returns Rugged Projects Fun Fact with investment details
 */
export async function analyzeRuggedProjects(address: string): Promise<RuggedProjectsFunFact> {
  try {
    console.log('📦 Analyzing rugged projects...');

    // Step 1: Fetch ALL current holdings (no value filter - we need even worthless tokens)
    const holdingsResponse = await nansenService.getCurrentBalance({
      address,
      chain: 'all',
      hide_spam_token: true,
      pagination: {
        page: 1,
        per_page: 100,
      },
      order_by: [
        {
          field: 'value_usd',
          direction: 'DESC',
        },
      ],
      // NO VALUE FILTER - rugged tokens will have low current value
    });

    if (!holdingsResponse.data || holdingsResponse.data.length === 0) {
      return {
        type: 'rugged_projects',
        success: true,
        data: {
          ruggedCount: 0,
          ruggedTokens: [],
        },
        fallback: 'No rugged projects detected—clear skies ahead',
      };
    }

    const holdings = holdingsResponse.data;
    console.log(`  Found ${holdings.length} total holdings`);

    // Step 2: Fetch transaction history (last 2 years)
    const historyStartDate = subYears(new Date(), 2);
    
    // Note: Nansen API requires specific chain, can't use 'all' for transactions
    // We'll fetch Ethereum first (most common), can expand to other chains later
    const txHistoryResponse = await nansenService.getAllTransactions({
      address,
      chain: 'ethereum',
      date: {
        from: historyStartDate.toISOString(),
        to: new Date().toISOString(),
      },
      hide_spam_token: true,
      pagination: {
        page: 1,
        per_page: 100,
      },
      order_by: [
        {
          field: 'block_timestamp',
          direction: 'DESC',
        },
      ],
    });

    const transactions = txHistoryResponse.data || [];
    console.log(`  Found ${transactions.length} transactions`);

    // Step 3: Build purchase history map with token amounts
    interface PurchaseInfo {
      totalInvested: number;
      firstPurchaseDate: Date;
      lastPurchaseDate: Date;
      txCount: number;
      tokensPurchased: number;  // NEW: Track tokens received
      tokensSold: number;        // NEW: Track tokens sent
      netPosition: number;       // NEW: purchased - sold
    }

    const purchaseMap = new Map<string, PurchaseInfo>();

    transactions.forEach(tx => {
      // Track tokens RECEIVED (purchases)
      if (tx.tokens_received && tx.tokens_received.length > 0) {
        tx.tokens_received.forEach(token => {
          const key = `${token.token_address}-${tx.chain}`.toLowerCase();
          const txDate = new Date(tx.block_timestamp);
          const tokenAmount = token.token_amount || 0;

          if (!purchaseMap.has(key)) {
            purchaseMap.set(key, {
              totalInvested: tx.volume_usd || 0,
              firstPurchaseDate: txDate,
              lastPurchaseDate: txDate,
              txCount: 1,
              tokensPurchased: tokenAmount,
              tokensSold: 0,
              netPosition: tokenAmount,
            });
          } else {
            const existing = purchaseMap.get(key)!;
            existing.totalInvested += tx.volume_usd || 0;
            existing.tokensPurchased += tokenAmount;
            existing.txCount++;
            if (txDate < existing.firstPurchaseDate) {
              existing.firstPurchaseDate = txDate;
            }
            if (txDate > existing.lastPurchaseDate) {
              existing.lastPurchaseDate = txDate;
            }
            existing.netPosition = existing.tokensPurchased - existing.tokensSold;
          }
        });
      }

      // Track tokens SENT (sales/transfers)
      if (tx.tokens_sent && tx.tokens_sent.length > 0) {
        tx.tokens_sent.forEach(token => {
          const key = `${token.token_address}-${tx.chain}`.toLowerCase();
          const tokenAmount = token.token_amount || 0;

          if (purchaseMap.has(key)) {
            const existing = purchaseMap.get(key)!;
            existing.tokensSold += tokenAmount;
            existing.netPosition = existing.tokensPurchased - existing.tokensSold;
          }
        });
      }
    });

    console.log(`  Built purchase history for ${purchaseMap.size} tokens`);

    // Step 4: Identify rugged tokens
    const ruggedTokens: Array<{
      name: string;
      symbol: string;
      chain: string;
      amountInvested: number;
      currentValue: number;
      lossPercent: number;
      lossAmount: number;
      purchaseDate: string;
      confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    }> = [];

    for (const holding of holdings) {
      // Skip native tokens (can't be rugged)
      if (!holding.token_address ||
          holding.token_address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ||
          holding.token_address.toLowerCase() === '0x000000000000000000000000000000000000800a') {
        continue;
      }

      const key = `${holding.token_address}-${holding.chain}`.toLowerCase();
      const purchase = purchaseMap.get(key);

      // Skip if never purchased (airdrops, etc.) - only analyze tokens user bought
      if (!purchase) continue;

      // Skip if insignificant investment
      if (purchase.totalInvested < MIN_INVESTMENT) continue;

      // NEW: Calculate hold percentage to detect if user sold their position
      const tokensCurrentlyHeld = (holding as any).token_amount || 0;
      const netPosition = purchase.netPosition;
      
      // Skip if user sold everything (or net position is zero/negative)
      if (netPosition <= 0) {
        console.log(`  Skipping ${holding.token_symbol}: Sold entire position (net: ${netPosition})`);
        continue;
      }
      
      // Calculate what % of their position they still hold
      const holdPercentage = tokensCurrentlyHeld / netPosition;
      
      // NEW: Skip if user sold >50% of position (intentional exit, not rugged)
      if (holdPercentage <= 0.5) {
        console.log(`  Skipping ${holding.token_symbol}: Only holds ${(holdPercentage * 100).toFixed(1)}% of position (sold ${((1 - holdPercentage) * 100).toFixed(1)}%)`);
        continue;
      }
      
      // NEW: Skip dust positions (even if hold >50%, value must be meaningful)
      const currentValue = holding.value_usd;
      if (currentValue < 10) {
        console.log(`  Skipping ${holding.token_symbol}: Dust position ($${currentValue.toFixed(2)})`);
        continue;
      }

      // Calculate loss
      const lossPercent = ((currentValue - purchase.totalInvested) / purchase.totalInvested) * 100;
      const lossAmount = currentValue - purchase.totalInvested;

      // Check rug criteria
      const isLargeEnoughLoss = lossPercent <= LOSS_THRESHOLD; // Lost 90%+
      const daysSinceLastPurchase = differenceInDays(new Date(), purchase.lastPurchaseDate);
      const isOldEnough = daysSinceLastPurchase > MIN_AGE_DAYS; // 30+ days old
      const isEffectivelyDead = holding.price_usd < DEAD_PRICE_THRESHOLD; // Extremely low price
      const stillHoldsMost = holdPercentage > 0.8; // NEW: Holds >80% of position

      // Confidence scoring based on indicators
      let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      
      if (isLargeEnoughLoss && isOldEnough && isEffectivelyDead && stillHoldsMost) {
        // All 4 indicators = HIGH confidence rug
        confidence = 'HIGH';
      } else if (isLargeEnoughLoss && isOldEnough && (isEffectivelyDead || stillHoldsMost)) {
        // 3 out of 4 indicators = MEDIUM confidence
        confidence = 'MEDIUM';
      }

      // Flag if high or medium confidence
      if (confidence !== 'LOW') {
        ruggedTokens.push({
          name: holding.token_name,
          symbol: holding.token_symbol,
          chain: holding.chain,
          amountInvested: purchase.totalInvested,
          currentValue,
          lossPercent,
          lossAmount,
          purchaseDate: purchase.firstPurchaseDate.toISOString(),
          confidence,
        });
      }
    }

    // Sort by worst losses first
    ruggedTokens.sort((a, b) => a.lossAmount - b.lossAmount);

    // Calculate total loss
    const totalLoss = ruggedTokens.reduce((sum, token) => sum + token.lossAmount, 0);

    console.log(`  Detected ${ruggedTokens.length} potentially rugged tokens`);

    if (ruggedTokens.length === 0) {
      return {
        type: 'rugged_projects',
        success: true,
        data: {
          ruggedCount: 0,
          ruggedTokens: [],
        },
        fallback: 'No rugged projects detected—clear skies ahead',
      };
    }

    return {
      type: 'rugged_projects',
      success: true,
      data: {
        ruggedCount: ruggedTokens.length,
        ruggedTokens,
        totalLoss,
      },
    };
  } catch (error) {
    console.error('Error analyzing rugged projects:', error);
    return {
      type: 'rugged_projects',
      success: true,
      data: {
        ruggedCount: 0,
        ruggedTokens: [],
      },
      fallback: 'No rugged projects detected—clear skies ahead',
    };
  }
}
