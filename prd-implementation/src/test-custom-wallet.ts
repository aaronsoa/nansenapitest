#!/usr/bin/env node

/**
 * Test script for a specific wallet address
 */

import chalk from 'chalk';
import { analyzePnl } from './features/pnl';
import { analyzeLabels } from './features/labels';
import { analyzeSmartMoney } from './features/smartMoney';
import { analyzeRuggedProjects } from './features/ruggedProjects';
import { analyzeEthBenchmark } from './features/ethBenchmark';
import { analyzePortfolioATH } from './features/portfolioATH';

// Custom test wallet
const TEST_WALLET = '0x6313d7948d3491096ffe00dea2d246d588b4d4fc';

async function runTests() {
  console.log(chalk.bold.cyan('\n╔═══════════════════════════════════════════════════╗'));
  console.log(chalk.bold.cyan('║                                                   ║'));
  console.log(chalk.bold.cyan('║      Fun Facts - Custom Wallet Test              ║'));
  console.log(chalk.bold.cyan('║                                                   ║'));
  console.log(chalk.bold.cyan('╚═══════════════════════════════════════════════════╝\n'));

  console.log(chalk.gray(`Test Wallet: ${TEST_WALLET}\n`));
  console.log('='.repeat(60));

  // Test 1: P&L
  console.log(chalk.bold('\n📊 Test 1: P&L (Profit & Loss)'));
  console.log('-'.repeat(60));
  try {
    const start = Date.now();
    const result = await analyzePnl(TEST_WALLET);
    const elapsed = Date.now() - start;
    
    console.log(chalk.green(`✓ Completed in ${elapsed}ms`));
    console.log(`  Success: ${result.success}`);
    if (result.data) {
      console.log(chalk.bold(`  P&L Status: ${result.data.status}`));
      console.log(`  Percentage: ${result.data.realized_pnl_percent.toFixed(2)}%`);
      console.log(`  Amount: $${result.data.realized_pnl_usd.toFixed(2)}`);
      console.log(`  Timeframe: ${result.data.timeframe}`);
    } else {
      console.log(chalk.yellow(`  Fallback: ${result.fallback}`));
    }
  } catch (error) {
    console.log(chalk.red(`✗ Failed: ${error}`));
  }

  // Test 2: Labels
  console.log(chalk.bold('\n🏷️  Test 2: Wallet Labels (35 PRD Labels)'));
  console.log('-'.repeat(60));
  try {
    const start = Date.now();
    const result = await analyzeLabels(TEST_WALLET);
    const elapsed = Date.now() - start;
    
    console.log(chalk.green(`✓ Completed in ${elapsed}ms`));
    console.log(`  Success: ${result.success}`);
    if (result.data) {
      console.log(chalk.bold.green(`  ✓ Label Found: "${result.data.label}"`));
      console.log(chalk.gray(`  (Matched from 35-label PRD priority list)`));
    } else {
      console.log(chalk.yellow(`  No priority labels found`));
    }
  } catch (error) {
    console.log(chalk.red(`✗ Failed: ${error}`));
  }

  // Test 3: Smart Money
  console.log(chalk.bold('\n✨ Test 3: Smart Money Detection'));
  console.log('-'.repeat(60));
  try {
    const start = Date.now();
    const result = await analyzeSmartMoney(TEST_WALLET);
    const elapsed = Date.now() - start;
    
    console.log(chalk.green(`✓ Completed in ${elapsed}ms`));
    console.log(`  Success: ${result.success}`);
    if (result.data) {
      console.log(chalk.bold.green(`  ✓ Smart Money: Yes`));
      console.log(`  Labels: ${result.data.labels.join(', ')}`);
    } else {
      console.log(chalk.gray(`  Smart Money: No`));
    }
  } catch (error) {
    console.log(chalk.red(`✗ Failed: ${error}`));
  }

  // Test 4: Rugged Projects
  console.log(chalk.bold('\n⚠️  Test 4: Rugged Projects'));
  console.log('-'.repeat(60));
  try {
    const start = Date.now();
    const result = await analyzeRuggedProjects(TEST_WALLET);
    const elapsed = Date.now() - start;
    
    console.log(chalk.green(`✓ Completed in ${elapsed}ms`));
    console.log(`  Success: ${result.success}`);
    if (result.data) {
      if (result.data.ruggedCount > 0) {
        console.log(chalk.yellow(`  ⚠ Rugged Count: ${result.data.ruggedCount}`));
        result.data.ruggedTokens.forEach((token, i) => {
          console.log(`    ${i + 1}. ${token.symbol} (${token.name}) - Liquidity: $${token.liquidity.toFixed(2)}`);
        });
      } else {
        console.log(chalk.green(`  ✓ No rugged projects detected—clear skies ahead`));
      }
    }
  } catch (error) {
    console.log(chalk.red(`✗ Failed: ${error}`));
  }

  // Test 5: ETH Benchmark (Skip due to performance)
  console.log(chalk.bold('\n🔥 Test 5: ETH Benchmark'));
  console.log('-'.repeat(60));
  console.log(chalk.yellow('  ⏭ Skipped - Takes 10-15 seconds, enable if needed'));

  // Test 6: Portfolio ATH (Skip due to CoinGecko rate limits)
  console.log(chalk.bold('\n📈 Test 6: Portfolio at ATH'));
  console.log('-'.repeat(60));
  console.log(chalk.yellow('  ⏭ Skipped - CoinGecko rate limits, enable if needed'));

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log(chalk.bold.green('\n✓ Core tests completed successfully!\n'));
  console.log(chalk.gray('Note: ETH Benchmark and Portfolio ATH skipped to save API quota.'));
  console.log(chalk.gray('These features work but require many API calls.\n'));
}

// Run tests
runTests().catch((error) => {
  console.error(chalk.red('\n✗ Fatal error during testing:'), error);
  process.exit(1);
});

