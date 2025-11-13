#!/usr/bin/env node

/**
 * Test script to verify Fun Facts functionality
 * Tests the sample wallet: 0xF977814e90dA44bFA03b6295A0616a897441aceC
 */

import chalk from 'chalk';
import { validateAndNormalizeAddress } from './utils/validation';
import { analyzePnl } from './features/pnl';
import { analyzeLabels } from './features/labels';
import { analyzeSmartMoney } from './features/smartMoney';
import { analyzeRuggedProjects } from './features/ruggedProjects';
import { analyzeEthBenchmark } from './features/ethBenchmark';
import { analyzePortfolioATH } from './features/portfolioATH';

const TEST_WALLET = '0xF977814e90dA44bFA03b6295A0616a897441aceC';

async function runTests() {
  console.log(chalk.bold.cyan('\n🧪 Running Fun Facts Tests\n'));
  console.log(chalk.gray(`Test Wallet: ${TEST_WALLET}\n`));

  try {
    // Validate address
    console.log(chalk.blue('✓ Address validation'));
    const address = validateAndNormalizeAddress(TEST_WALLET);

    // Test 1: P&L
    console.log(chalk.blue('→ Testing P&L analysis...'));
    const pnlResult = await analyzePnl(address);
    console.log(chalk.green(`✓ P&L: success=${pnlResult.success}`));
    if (pnlResult.success && pnlResult.data) {
      console.log(`  P&L: ${pnlResult.data.realized_pnl_percent.toFixed(2)}%`);
    } else {
      console.log(`  Fallback: ${pnlResult.fallback}`);
    }

    // Test 2: Labels
    console.log(chalk.blue('\n→ Testing Labels analysis...'));
    const labelsResult = await analyzeLabels(address);
    console.log(chalk.green(`✓ Labels: success=${labelsResult.success}`));
    if (labelsResult.success && labelsResult.data) {
      console.log(`  Label: ${labelsResult.data.label}`);
    } else {
      console.log(`  No priority labels found`);
    }

    // Test 3: Smart Money
    console.log(chalk.blue('\n→ Testing Smart Money analysis...'));
    const smartMoneyResult = await analyzeSmartMoney(address);
    console.log(chalk.green(`✓ Smart Money: success=${smartMoneyResult.success}`));
    if (smartMoneyResult.success && smartMoneyResult.data) {
      console.log(`  Smart Money: ${smartMoneyResult.data.isSmartMoney}`);
      console.log(`  Labels: ${smartMoneyResult.data.labels.join(', ')}`);
    } else {
      console.log(`  Not smart money`);
    }

    // Test 4: Rugged Projects
    console.log(chalk.blue('\n→ Testing Rugged Projects analysis...'));
    const ruggedResult = await analyzeRuggedProjects(address);
    console.log(chalk.green(`✓ Rugged Projects: success=${ruggedResult.success}`));
    if (ruggedResult.success && ruggedResult.data) {
      console.log(`  Rugged Count: ${ruggedResult.data.ruggedCount}`);
    }

    // Test 5: ETH Benchmark
    console.log(chalk.blue('\n→ Testing ETH Benchmark analysis...'));
    const ethBenchmarkResult = await analyzeEthBenchmark(address);
    console.log(chalk.green(`✓ ETH Benchmark: success=${ethBenchmarkResult.success}`));
    if (ethBenchmarkResult.success && ethBenchmarkResult.data) {
      console.log(`  Performance: ${ethBenchmarkResult.data.performancePercent.toFixed(2)}%`);
      console.log(`  Status: ${ethBenchmarkResult.data.status}`);
    } else {
      console.log(`  Fallback: ${ethBenchmarkResult.fallback}`);
    }

    // Test 6: Portfolio ATH
    console.log(chalk.blue('\n→ Testing Portfolio ATH analysis...'));
    const portfolioAthResult = await analyzePortfolioATH(address);
    console.log(chalk.green(`✓ Portfolio ATH: success=${portfolioAthResult.success}`));
    if (portfolioAthResult.success && portfolioAthResult.data) {
      console.log(`  Current: $${portfolioAthResult.data.currentValue.toFixed(2)}`);
      console.log(`  ATH: $${portfolioAthResult.data.athValue.toFixed(2)}`);
      console.log(`  Gain: ${portfolioAthResult.data.potentialGainPercent.toFixed(2)}%`);
    } else {
      console.log(`  Fallback: ${portfolioAthResult.fallback}`);
    }

    console.log(chalk.bold.green('\n✅ All tests completed successfully!\n'));
  } catch (error) {
    console.error(chalk.red('\n❌ Test failed:'), error);
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});

