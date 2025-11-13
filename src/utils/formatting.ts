import chalk from 'chalk';

/**
 * Formats a USD value with proper currency formatting
 * @param value - The value to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string
 */
export function formatUSD(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formats a percentage value
 * @param value - The percentage value (e.g., 15.5 for 15.5%)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string
 */
export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Formats a percentage with color coding (green for positive, red for negative)
 * @param value - The percentage value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Colored formatted string
 */
export function formatPercentColored(value: number, decimals: number = 2): string {
  const formatted = formatPercent(value, decimals);
  return value >= 0 ? chalk.green(formatted) : chalk.red(formatted);
}

/**
 * Formats a number with commas
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted string
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Creates a section header for output
 * @param title - The section title
 * @returns Formatted header string
 */
export function createSectionHeader(title: string): string {
  return chalk.bold.cyan(`\n${'='.repeat(50)}\n${title}\n${'='.repeat(50)}\n`);
}

/**
 * Creates a fun fact display
 * @param number - The fun fact number
 * @param title - The fun fact title
 * @param content - The content to display
 * @returns Formatted fun fact string
 */
export function displayFunFact(number: number, title: string, content: string): string {
  const header = chalk.bold.yellow(`\n🎲 Fun Fact #${number}: ${title}`);
  const separator = chalk.gray('─'.repeat(50));
  return `${header}\n${separator}\n${content}\n`;
}

/**
 * Creates a success message
 * @param message - The message to display
 * @returns Formatted success message
 */
export function successMessage(message: string): string {
  return chalk.green(`✓ ${message}`);
}

/**
 * Creates an error message
 * @param message - The message to display
 * @returns Formatted error message
 */
export function errorMessage(message: string): string {
  return chalk.red(`✗ ${message}`);
}

/**
 * Creates a warning message
 * @param message - The message to display
 * @returns Formatted warning message
 */
export function warningMessage(message: string): string {
  return chalk.yellow(`⚠ ${message}`);
}

/**
 * Creates an info message
 * @param message - The message to display
 * @returns Formatted info message
 */
export function infoMessage(message: string): string {
  return chalk.blue(`ℹ ${message}`);
}

