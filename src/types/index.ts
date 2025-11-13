// ============================================
// Common Types
// ============================================

export interface DateRange {
  from: string; // ISO 8601 format
  to: string;   // ISO 8601 format
}

export interface Pagination {
  page: number;
  per_page?: number;
  recordsPerPage?: number;
}

// ============================================
// Nansen API Types
// ============================================

// P&L Summary
export interface PnlSummaryRequest {
  address: string;
  chain: string;
  date: DateRange;
}

export interface PnlSummaryResponse {
  realized_pnl_usd: number;
  realized_pnl_percent: number;
  unrealized_pnl_usd?: number;
  unrealized_pnl_percent?: number;
  traded_token_count?: number;
  traded_times?: number;
  win_rate?: number;
  top5_tokens?: Array<{
    realized_pnl: number;
    realized_roi: number;
    token_address: string;
    token_symbol: string;
    chain: string;
  }>;
  pagination?: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
}

// Labels
export interface LabelsRequest {
  parameters: {
    chain: string;
    address: string;
  };
  pagination: {
    page: number;
    recordsPerPage: number;
  };
}

export interface Label {
  label: string;
  category?: string;
  definition?: string;
  smEarnedDate?: string | null;
  fullname?: string;
  labelType?: string;
  source?: string;
}

export type LabelsResponse = Label[];

// Current Balance
export interface CurrentBalanceRequest {
  address: string;
  chain: string;
  hide_spam_token: boolean;
  filters?: {
    value_usd?: {
      min?: number;
      max?: number;
    };
  };
  pagination: Pagination;
  order_by?: Array<{
    field: string;
    direction: 'ASC' | 'DESC';
  }>;
}

export interface TokenBalance {
  token_address: string;
  token_name: string;
  token_symbol: string;
  chain: string;
  balance: string;
  balance_usd: number;
  value_usd: number;
  price_usd: number;
}

export interface CurrentBalanceResponse {
  data: TokenBalance[];
  pagination: {
    total?: number;
    page: number;
    per_page: number;
    is_last_page?: boolean;
  };
}

// Transactions
export interface TransactionsRequest {
  address: string;
  chain: string;
  date?: DateRange;
  hide_spam_token?: boolean;
  filters?: {
    volume_usd?: {
      min?: number;
      max?: number;
    };
  };
  pagination: Pagination;
  order_by?: Array<{
    field: string;
    direction: 'ASC' | 'DESC';
  }>;
}

export interface TokenTransfer {
  token_symbol: string;
  token_amount: number;
  price_usd: number | null;
  value_usd: number | null;
  token_address: string;
  chain: string;
  from_address: string;
  to_address: string;
  from_address_label?: string;
  to_address_label?: string;
}

export interface Transaction {
  block_timestamp: string;
  transaction_hash: string;
  chain: string;
  method: string;
  tokens_sent: TokenTransfer[];
  tokens_received: TokenTransfer[];
  volume_usd: number;
  source_type: string;
}

export interface TransactionsResponse {
  data: Transaction[];
  pagination: {
    total?: number;
    page: number;
    per_page: number;
    is_last_page?: boolean;
  };
}

// Token Screener
export interface TokenScreenerRequest {
  chains: string[];
  date?: DateRange;
  watchlistFilter?: string[];
  filters?: {
    liquidity?: {
      from: number;
      to: number;
    };
  };
  pagination: Pagination;
  order?: {
    orderBy: string;
    order: 'asc' | 'desc';
  };
}

export interface TokenScreenerItem {
  token_address: string;
  token_name: string;
  token_symbol: string;
  chain: string;
  liquidity: number;
  liquidity_usd: number;
}

export interface TokenScreenerResponse {
  data: {
    items: TokenScreenerItem[];
    pagination: {
      total: number;
      page: number;
      per_page: number;
    };
  };
}

// ============================================
// CoinGecko API Types
// ============================================

// Historical Price
export interface HistoricalPriceResponse {
  id: string;
  symbol: string;
  name: string;
  market_data: {
    current_price: {
      usd: number;
    };
  };
}

// Current Price
export interface CurrentPriceResponse {
  [coinId: string]: {
    usd: number;
  };
}

// Market Chart
export interface MarketChartResponse {
  prices: [number, number][]; // [timestamp, price]
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

// ============================================
// Fun Facts Result Types
// ============================================

export interface PnlFunFact {
  type: 'pnl';
  success: boolean;
  data?: {
    realized_pnl_percent: number;
    realized_pnl_usd: number;
    status: 'GAIN' | 'LOSS';
    timeframe: string;
  };
  fallback?: string;
}

export interface LabelsFunFact {
  type: 'labels';
  success: boolean;
  data?: {
    label: string;
  };
  fallback?: string | null;
}

export interface SmartMoneyFunFact {
  type: 'smart_money';
  success: boolean;
  data?: {
    isSmartMoney: boolean;
    labels: string[];
  };
  fallback?: string | null;
}

export interface RuggedProjectsFunFact {
  type: 'rugged_projects';
  success: boolean;
  data?: {
    ruggedCount: number;
    ruggedTokens: Array<{
      name: string;
      symbol: string;
      chain: string;
      amountInvested: number;      // What user paid
      currentValue: number;         // What it's worth now
      lossPercent: number;          // % loss
      lossAmount: number;           // $ loss
      purchaseDate: string;         // When first bought (ISO format)
      confidence: 'HIGH' | 'MEDIUM' | 'LOW'; // Confidence level
    }>;
    totalLoss?: number;             // Total loss across all rugged tokens
  };
  fallback?: string;
}

export interface EthBenchmarkFunFact {
  type: 'eth_benchmark';
  success: boolean;
  data?: {
    portfolioValue: number;
    ethEquivalentValue: number;
    performancePercent: number;
    status: 'OUTPERFORMED' | 'UNDERPERFORMED';
    sampleSize?: number; // Number of transactions analyzed
    totalTransactions?: number; // Total transactions available
  };
  fallback?: string;
}

export interface PortfolioAthFunFact {
  type: 'portfolio_ath';
  success: boolean;
  data?: {
    currentValue: number;
    athValue: number;
    potentialGainPercent: number;
    sampleSize?: number; // Number of holdings analyzed
    successfulTokens?: number; // Number of holdings with ATH data
  };
  fallback?: string;
}

export type FunFact = 
  | PnlFunFact 
  | LabelsFunFact 
  | SmartMoneyFunFact 
  | RuggedProjectsFunFact 
  | EthBenchmarkFunFact 
  | PortfolioAthFunFact;

