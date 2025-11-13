import axios, { AxiosInstance } from 'axios';
import * as dotenv from 'dotenv';
import {
  PnlSummaryRequest,
  PnlSummaryResponse,
  LabelsRequest,
  LabelsResponse,
  CurrentBalanceRequest,
  CurrentBalanceResponse,
  TokenBalance,
  TransactionsRequest,
  TransactionsResponse,
  Transaction,
  TokenScreenerRequest,
  TokenScreenerResponse,
} from '../types';

dotenv.config();

export class NansenService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NANSEN_API_KEY || '';
    
    if (!this.apiKey) {
      throw new Error('NANSEN_API_KEY is not set in environment variables');
    }

    this.client = axios.create({
      baseURL: 'https://api.nansen.ai',
      headers: {
        'apiKey': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });
  }

  /**
   * Get P&L Summary for a wallet address
   * @param request - P&L summary request parameters
   * @returns P&L summary data
   */
  async getPnlSummary(request: PnlSummaryRequest): Promise<PnlSummaryResponse> {
    try {
      const response = await this.client.post<PnlSummaryResponse>(
        '/api/v1/profiler/address/pnl-summary',
        request
      );
      return response.data;
    } catch (error) {
      this.handleError('getPnlSummary', error);
      throw error;
    }
  }

  /**
   * Get labels/tags for a wallet address
   * @param request - Labels request parameters
   * @returns Labels data
   */
  async getLabels(request: LabelsRequest): Promise<LabelsResponse> {
    try {
      const response = await this.client.post<LabelsResponse>(
        '/api/beta/profiler/address/labels',
        request
      );
      return response.data;
    } catch (error) {
      this.handleError('getLabels', error);
      throw error;
    }
  }

  /**
   * Get current balance for a wallet address
   * @param request - Current balance request parameters
   * @returns Current balance data
   */
  async getCurrentBalance(request: CurrentBalanceRequest): Promise<CurrentBalanceResponse> {
    try {
      const response = await this.client.post<CurrentBalanceResponse>(
        '/api/v1/profiler/address/current-balance',
        request
      );
      return response.data;
    } catch (error) {
      this.handleError('getCurrentBalance', error);
      throw error;
    }
  }

  /**
   * Get all current balances with pagination support
   * @param request - Current balance request parameters
   * @returns All token balances across all pages
   */
  async getAllCurrentBalances(request: CurrentBalanceRequest): Promise<CurrentBalanceResponse> {
    const allBalances: TokenBalance[] = [];
    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const pageRequest = {
        ...request,
        pagination: {
          ...request.pagination,
          page: currentPage,
        },
      };

      const response = await this.getCurrentBalance(pageRequest);
      
      // Check if response has valid data
      if (!response.data || !Array.isArray(response.data)) {
        break;
      }
      
      allBalances.push(...response.data);

      // Check if there are more pages using is_last_page field
      hasMorePages = !response.pagination?.is_last_page;
      currentPage++;
    }

    return {
      data: allBalances,
      pagination: {
        total: allBalances.length,
        page: 1,
        per_page: allBalances.length,
        is_last_page: true,
      },
    };
  }

  /**
   * Get transactions for a wallet address
   * @param request - Transactions request parameters
   * @returns Transactions data
   */
  async getTransactions(request: TransactionsRequest): Promise<TransactionsResponse> {
    try {
      const response = await this.client.post<TransactionsResponse>(
        '/api/v1/profiler/address/transactions',
        request
      );
      return response.data;
    } catch (error) {
      this.handleError('getTransactions', error);
      throw error;
    }
  }

  /**
   * Get all transactions with pagination support
   * @param request - Transactions request parameters
   * @returns All transactions across all pages
   */
  async getAllTransactions(request: TransactionsRequest): Promise<TransactionsResponse> {
    const allTransactions: Transaction[] = [];
    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const pageRequest = {
        ...request,
        pagination: {
          ...request.pagination,
          page: currentPage,
        },
      };

      const response = await this.getTransactions(pageRequest);
      
      // Check if response has valid data
      if (!response.data || !Array.isArray(response.data)) {
        break;
      }
      
      allTransactions.push(...response.data);

      // Check if there are more pages using is_last_page field
      hasMorePages = !response.pagination?.is_last_page;
      currentPage++;

      // Safety limit to prevent infinite loops
      if (currentPage > 100) {
        console.warn('Reached maximum page limit (100) for transactions');
        break;
      }
    }

    return {
      data: allTransactions,
      pagination: {
        total: allTransactions.length,
        page: 1,
        per_page: allTransactions.length,
        is_last_page: true,
      },
    };
  }

  /**
   * Screen tokens for specific criteria
   * @param request - Token screener request parameters
   * @returns Token screener data
   */
  async screenTokens(request: TokenScreenerRequest): Promise<TokenScreenerResponse> {
    try {
      const response = await this.client.post<TokenScreenerResponse>(
        '/api/v1/token-screener',
        request
      );
      return response.data;
    } catch (error) {
      this.handleError('screenTokens', error);
      throw error;
    }
  }

  /**
   * Handle and log errors from API calls
   * @param methodName - Name of the method that errored
   * @param error - The error object
   */
  private handleError(methodName: string, error: any): void {
    if (axios.isAxiosError(error)) {
      console.error(`[Nansen ${methodName}] API Error:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
    } else {
      console.error(`[Nansen ${methodName}] Unexpected Error:`, error);
    }
  }
}

// Export a singleton instance
export const nansenService = new NansenService();

