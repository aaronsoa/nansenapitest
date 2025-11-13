/**
 * Validates an Ethereum wallet address
 * @param address - The address to validate
 * @returns true if valid, false otherwise
 */
export function isValidEthereumAddress(address: string): boolean {
  // Check if it starts with 0x and has 40 hex characters after
  const regex = /^0x[a-fA-F0-9]{40}$/;
  return regex.test(address);
}

/**
 * Validates and normalizes an Ethereum address
 * @param address - The address to validate
 * @returns The normalized address or throws an error
 */
export function validateAndNormalizeAddress(address: string): string {
  const trimmed = address.trim();
  
  if (!isValidEthereumAddress(trimmed)) {
    throw new Error('Invalid Ethereum address format. Expected format: 0x followed by 40 hexadecimal characters');
  }
  
  return trimmed.toLowerCase();
}

/**
 * Truncates an Ethereum address for display
 * @param address - The address to truncate
 * @param startChars - Number of characters to show at start (default: 6)
 * @param endChars - Number of characters to show at end (default: 4)
 * @returns Truncated address
 */
export function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address || address.length < startChars + endChars) {
    return address;
  }
  
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
}

