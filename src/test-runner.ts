import 'dotenv/config';
import chalk from 'chalk';
import { analyzePnl } from './features/pnl';
import { analyzeLabels } from './features/labels';
import { analyzeSmartMoney } from './features/smartMoney';
import { analyzeRuggedProjects } from './features/ruggedProjects';
import { analyzeEthBenchmark } from './features/ethBenchmark';
import { analyzePortfolioATH } from './features/portfolioATH';
import {
  formatPercent,
  formatPercentColored,
  formatUSD,
} from './utils/formatting';

interface TestResult {
  feature: string;
  success: boolean;
  summary: string;
  duration: number;
}

async function runAllFunFacts(address: string): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Test 1: P&L
  const pnlStart = Date.now();
  try {
    const pnlResult = await analyzePnl(address);
    const duration = Date.now() - pnlStart;
    
    if (pnlResult.success && pnlResult.data) {
      const status = pnlResult.data.status === 'GAIN' ? 'GAIN' : 'LOSS';
      const pnl = `${status} ${formatPercent(pnlResult.data.realized_pnl_percent)} (${formatUSD(pnlResult.data.realized_pnl_usd)})`;
      results.push({ feature: 'P&L', success: true, summary: pnl, duration });
    } else {
      results.push({ feature: 'P&L', success: false, summary: pnlResult.fallback || 'No data', duration });
    }
  } catch (error) {
    results.push({ feature: 'P&L', success: false, summary: 'Error occurred', duration: Date.now() - pnlStart });
  }

  // Test 2: Labels
  const labelsStart = Date.now();
  try {
    const labelsResult = await analyzeLabels(address);
    const duration = Date.now() - labelsStart;
    
    if (labelsResult.success && labelsResult.data) {
      results.push({ feature: 'Labels', success: true, summary: labelsResult.data.label, duration });
    } else {
      results.push({ feature: 'Labels', success: false, summary: labelsResult.fallback || 'No labels', duration });
    }
  } catch (error) {
    results.push({ feature: 'Labels', success: false, summary: 'Error occurred', duration: Date.now() - labelsStart });
  }

  // Test 3: Smart Money
  const smartMoneyStart = Date.now();
  try {
    const smartMoneyResult = await analyzeSmartMoney(address);
    const duration = Date.now() - smartMoneyStart;
    
    if (smartMoneyResult.success && smartMoneyResult.data && smartMoneyResult.data.isSmartMoney) {
      const labels = smartMoneyResult.data.labels.length > 0 
        ? ` (${smartMoneyResult.data.labels.join(', ')})` 
        : '';
      results.push({ feature: 'Smart Money', success: true, summary: `Identified${labels}`, duration });
    } else {
      results.push({ feature: 'Smart Money', success: true, summary: 'Not identified', duration });
    }
  } catch (error) {
    results.push({ feature: 'Smart Money', success: false, summary: 'Error occurred', duration: Date.now() - smartMoneyStart });
  }

  // Test 4: Rugged Projects
  const ruggedStart = Date.now();
  try {
    const ruggedResult = await analyzeRuggedProjects(address);
    const duration = Date.now() - ruggedStart;
    
    if (ruggedResult.success && ruggedResult.data) {
      if (ruggedResult.data.ruggedCount > 0) {
        const summary = `${ruggedResult.data.ruggedCount} detected (${formatUSD(ruggedResult.data.totalLoss || 0)} loss)`;
        results.push({ feature: 'Rugged Projects', success: true, summary, duration });
      } else {
        results.push({ feature: 'Rugged Projects', success: true, summary: 'None detected', duration });
      }
    } else {
      results.push({ feature: 'Rugged Projects', success: false, summary: 'No data', duration });
    }
  } catch (error) {
    results.push({ feature: 'Rugged Projects', success: false, summary: 'Error occurred', duration: Date.now() - ruggedStart });
  }

  // Test 5: ETH Benchmark
  const ethBenchmarkStart = Date.now();
  try {
    const ethBenchmarkResult = await analyzeEthBenchmark(address);
    const duration = Date.now() - ethBenchmarkStart;
    
    if (ethBenchmarkResult.success && ethBenchmarkResult.data) {
      const status = ethBenchmarkResult.data.status === 'OUTPERFORMED' ? 'OUTPERFORMED' : 'UNDERPERFORMED';
      const perf = `${status} ${formatPercent(ethBenchmarkResult.data.performancePercent)}`;
      results.push({ feature: 'ETH Benchmark', success: true, summary: perf, duration });
    } else {
      results.push({ feature: 'ETH Benchmark', success: false, summary: ethBenchmarkResult.fallback || 'No data', duration });
    }
  } catch (error) {
    results.push({ feature: 'ETH Benchmark', success: false, summary: 'Error occurred', duration: Date.now() - ethBenchmarkStart });
  }

  // Test 6: Portfolio ATH
  const portfolioAthStart = Date.now();
  try {
    const portfolioAthResult = await analyzePortfolioATH(address);
    const duration = Date.now() - portfolioAthStart;
    
    if (portfolioAthResult.success && portfolioAthResult.data) {
      const gain = `${formatPercent(portfolioAthResult.data.potentialGainPercent)} potential gain`;
      results.push({ feature: 'Portfolio ATH', success: true, summary: gain, duration });
    } else {
      results.push({ feature: 'Portfolio ATH', success: false, summary: portfolioAthResult.fallback || 'No data', duration });
    }
  } catch (error) {
    results.push({ feature: 'Portfolio ATH', success: false, summary: 'Error occurred', duration: Date.now() - portfolioAthStart });
  }

  return results;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

async function testWallet(address: string) {
  const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  console.log(chalk.bold(`\nTesting Wallet: ${chalk.cyan(address)}`));
  console.log(chalk.bold(`${chalk.dim(truncated)}`));
  console.log(chalk.bold('━'.repeat(60)));
  
  const overallStart = Date.now();
  const results = await runAllFunFacts(address);
  const overallDuration = Date.now() - overallStart;
  
  // Display results
  results.forEach(result => {
    const icon = result.success ? chalk.green('✓') : chalk.red('✗');
    const feature = result.feature.padEnd(18);
    const timing = chalk.dim(`(${formatDuration(result.duration)})`);
    console.log(`${icon} ${feature} ${result.summary} ${timing}`);
  });
  
  // Summary
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  const successRate = ((successCount / totalCount) * 100).toFixed(0);
  
  console.log(chalk.bold('\n━'.repeat(60)));
  console.log(chalk.bold(`Completed: ${successCount}/${totalCount} (${successRate}%) in ${formatDuration(overallDuration)}`));
  
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(chalk.red('\n❌ Error: No wallet address provided\n'));
    console.log(chalk.bold('Usage:'));
    console.log(`  ${chalk.cyan('npm run test-wallet')} ${chalk.yellow('<address1>')} ${chalk.yellow('[address2]')} ${chalk.yellow('[...]')}\n`);
    console.log(chalk.bold('Examples:'));
    console.log(`  ${chalk.cyan('npm run test-wallet')} ${chalk.yellow('0x6313D7948D3491096Ffe00Dea2D246d588b4D4FC')}`);
    console.log(`  ${chalk.cyan('npm run test-wallet')} ${chalk.yellow('0x6313...d4fc')} ${chalk.yellow('0x018C...B6Fe')}\n`);
    process.exit(1);
  }
  
  console.log(chalk.bold.cyan('\n🎲 Fun Facts Test Runner\n'));
  console.log(chalk.dim(`Testing ${args.length} wallet${args.length > 1 ? 's' : ''}...`));
  
  const allResults: Array<{ address: string; results: TestResult[] }> = [];
  
  for (let i = 0; i < args.length; i++) {
    const address = args[i];
    const results = await testWallet(address);
    allResults.push({ address, results });
    
    // Add spacing between multiple wallets
    if (i < args.length - 1) {
      console.log('\n');
    }
  }
  
  // Overall summary for multiple wallets
  if (args.length > 1) {
    console.log(chalk.bold.cyan('\n\n📊 Overall Summary\n'));
    console.log(chalk.bold('━'.repeat(60)));
    
    allResults.forEach(({ address, results }) => {
      const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      const icon = successCount === totalCount ? chalk.green('✓') : chalk.yellow('⚠');
      console.log(`${icon} ${chalk.cyan(truncated)} - ${successCount}/${totalCount} features successful`);
    });
    
    console.log('');
  }
  
  console.log(chalk.green('\n✅ Test run complete!\n'));
}

main().catch(error => {
  console.error(chalk.red('\n❌ Fatal error:'), error.message);
  process.exit(1);
});

