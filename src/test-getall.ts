#!/usr/bin/env node

import axios from 'axios';
import * as dotenv from 'dotenv';
import { subMonths } from 'date-fns';

dotenv.config();

const API_KEY = process.env.NANSEN_API_KEY || '';
const TEST_WALLET = '0x6313D7948D3491096Ffe00Dea2D246d588b4D4FC';

async function testGetAllTransactions() {
  console.log('🧪 Testing getAllTransactions Logic\n');
  
  const client = axios.create({
    baseURL: 'https://api.nansen.ai',
    headers: {
      'apiKey': API_KEY,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  const now = new Date();
  const fromDate = subMonths(now, 6);

  // Simulate the getAllTransactions logic
  const allTransactions: any[] = [];
  let currentPage = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    console.log(`Fetching page ${currentPage}...`);
    
    const response = await client.post('/api/v1/profiler/address/transactions', {
      address: TEST_WALLET,
      chain: 'ethereum',
      date: {
        from: fromDate.toISOString(),
        to: now.toISOString(),
      },
      hide_spam_token: true,
      filters: {
        volume_usd: {
          min: 10,
        },
      },
      pagination: {
        page: currentPage,
        per_page: 100,
      },
      order_by: [
        {
          field: 'block_timestamp',
          direction: 'ASC',
        },
      ],
    });

    console.log(`  Response status:`, response.status);
    console.log(`  response.data exists?`, !!response.data);
    console.log(`  response.data.data exists?`, !!response.data?.data);
    console.log(`  Is array?`, Array.isArray(response.data?.data));
    console.log(`  Array length:`, response.data?.data?.length || 0);
    
    // Check if response has valid data
    if (!response.data?.data || !Array.isArray(response.data.data)) {
      console.log(`  ❌ Breaking because no valid data`);
      break;
    }
    
    allTransactions.push(...response.data.data);
    console.log(`  ✓ Added ${response.data.data.length} transactions`);
    console.log(`  Total so far: ${allTransactions.length}`);

    // Check if there are more pages
    console.log(`  is_last_page:`, response.data.pagination?.is_last_page);
    hasMorePages = !response.data.pagination?.is_last_page;
    console.log(`  hasMorePages:`, hasMorePages);
    
    currentPage++;

    if (currentPage > 3) {
      console.log('  Breaking for safety (max 3 pages for test)');
      break;
    }
  }

  console.log(`\nFinal count: ${allTransactions.length} transactions`);
}

testGetAllTransactions().catch(console.error);

