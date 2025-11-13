#!/usr/bin/env node

/**
 * Test script for specific wallet address
 */

import chalk from 'chalk';
import { validateAndNormalizeAddress, truncateAddress } from './utils/validation';
import { analyzePnl } from './features/pnl';
import { analyzeLabels } from './features/labels';
import { analyzeSmartMoney } from './features/smartMoney';
import { analyzeRuggedProjects } from './features/ruggedProjects';
import { analyzeEthBenchmark } from './features/ethBenchmark';
import { analyzePortfolioATH } from './features/portfolioATH';
import {
  displayFunFact,
  formatPercent,
  formatPercentColored,
  formatUSD,
  createSectionHeader,
  successMessage,
  warningMessage,
  infoMessage,
} from './utils/formatting';

const TEST_WALLET = '0x6313D7948D3491096Ffe00Dea2D246d588b4D4FC';

async function runTests() {
  console.log(chalk.bold.cyan('\n🎲 Fun Facts Wallet Analysis\n'));
  
  try {
    const address = validateAndNormalizeAddress(TEST_WALLET);
    console.log(chalk.gray(`Analyzing wallet: ${TEST_WALLET}`));
    console.log(chalk.gray(`Truncated: ${truncateAddress(address)}\n`));

    console.log(chalk.yellow('⏳ Fetching data from Nansen and CoinGecko APIs...\n'));

    // Test 1: P&L
    console.log(chalk.blue('→ Analyzing P&L...'));
    const pnlResult = await analyzePnl(address);
    
    if (pnlResult.success && pnlResult.data) {
      const statusColor = pnlResult.data.status === 'GAIN' ? chalk.green : chalk.red;
      console.log(displayFunFact(
        1,
        'P&L (Profit & Loss)',
        `${statusColor(pnlResult.data.status)}: ${formatPercentColored(pnlResult.data.realized_pnl_percent)} (${formatUSD(pnlResult.data.realized_pnl_usd)}) ${pnlResult.data.timeframe}`
      ));
    } else {
      console.log(displayFunFact(1, 'P&L (Profit & Loss)', warningMessage(pnlResult.fallback || 'No data')));
    }

    // Test 2: Labels
    console.log(chalk.blue('→ Analyzing Labels...'));
    const labelsResult = await analyzeLabels(address);
    
    if (labelsResult.success && labelsResult.data) {
      console.log(displayFunFact(
        2,
        'Wallet Labels',
        successMessage(`This wallet is labeled as: ${chalk.bold(labelsResult.data.label)}`)
      ));
    } else {
      console.log(displayFunFact(2, 'Wallet Labels', infoMessage('No priority labels found')));
    }

    // Test 3: Smart Money
    console.log(chalk.blue('→ Analyzing Smart Money...'));
    const smartMoneyResult = await analyzeSmartMoney(address);
    
    if (smartMoneyResult.success && smartMoneyResult.data) {
      console.log(displayFunFact(
        3,
        'Smart Money Trader',
        successMessage(`✨ Smart Money Detected! Labels: ${chalk.bold(smartMoneyResult.data.labels.join(', '))}`)
      ));
    } else {
      console.log(displayFunFact(3, 'Smart Money Trader', infoMessage('Not identified as smart money')));
    }

    // Test 4: Rugged Projects
    console.log(chalk.blue('→ Analyzing Rugged Projects...'));
    const ruggedResult = await analyzeRuggedProjects(address);
    
    if (ruggedResult.success && ruggedResult.data) {
      if (ruggedResult.data.ruggedCount > 0) {
        const tokenList = ruggedResult.data.ruggedTokens
          .map((t) => `  • ${t.symbol} (${t.chain})\n    Invested: ${formatUSD(t.amountInvested)} → Now: ${formatUSD(t.currentValue)}\n    Loss: ${formatPercent(t.lossPercent)} (${t.confidence})`)
          .join('\n');
        const totalLossText = ruggedResult.data.totalLoss ? `\nTotal Loss: ${formatUSD(ruggedResult.data.totalLoss)}` : '';
        console.log(displayFunFact(
          4,
          'Rugged Projects',
          warningMessage(`⚠️  Found ${ruggedResult.data.ruggedCount} potentially rugged project(s):${totalLossText}\n${tokenList}`)
        ));
      } else {
        console.log(displayFunFact(4, 'Rugged Projects', successMessage('No rugged projects detected—clear skies ahead')));
      }
    } else {
      console.log(displayFunFact(4, 'Rugged Projects', successMessage('No rugged projects detected')));
    }

    // Test 5: ETH Benchmark
    console.log(chalk.blue('→ Analyzing ETH Benchmark (this may take a while)...'));
    const ethBenchmarkResult = await analyzeEthBenchmark(address);
    
    if (ethBenchmarkResult.success && ethBenchmarkResult.data) {
      const statusText = ethBenchmarkResult.data.status === 'OUTPERFORMED'
        ? chalk.green('OUTPERFORMED')
        : chalk.red('UNDERPERFORMED');
      console.log(displayFunFact(
        5,
        'ETH Benchmark',
        `${statusText} ETH by ${formatPercentColored(ethBenchmarkResult.data.performancePercent)}\n  Portfolio Value: ${formatUSD(ethBenchmarkResult.data.portfolioValue)}\n  ETH Equivalent: ${formatUSD(ethBenchmarkResult.data.ethEquivalentValue)}`
      ));
    } else {
      console.log(displayFunFact(5, 'ETH Benchmark', warningMessage(ethBenchmarkResult.fallback || 'No data')));
    }

    // Test 6: Portfolio ATH
    console.log(chalk.blue('→ Analyzing Portfolio at ATH (this may take a while)...'));
    const portfolioAthResult = await analyzePortfolioATH(address);
    
    if (portfolioAthResult.success && portfolioAthResult.data) {
      console.log(displayFunFact(
        6,
        'Portfolio at ATH',
        `Current Value: ${formatUSD(portfolioAthResult.data.currentValue)}\nPotential at ATH: ${formatUSD(portfolioAthResult.data.athValue)}\nPotential Gain: ${formatPercentColored(portfolioAthResult.data.potentialGainPercent)}`
      ));
    } else {
      console.log(displayFunFact(6, 'Portfolio at ATH', warningMessage(portfolioAthResult.fallback || 'No data')));
    }

    console.log(chalk.bold.green('\n✅ Analysis complete!\n'));
  } catch (error) {
    console.error(chalk.red('\n❌ Analysis failed:'), error);
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});

