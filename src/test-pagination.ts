#!/usr/bin/env node

import axios from 'axios';
import * as dotenv from 'dotenv';
import { subMonths } from 'date-fns';

dotenv.config();

const API_KEY = process.env.NANSEN_API_KEY || '';
const TEST_WALLET = '0x6313D7948D3491096Ffe00Dea2D246d588b4D4FC';

async function testPagination() {
  console.log('🧪 Testing Pagination Logic\n');
  
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
      page: 1,
      per_page: 100,
    },
    order_by: [
      {
        field: 'block_timestamp',
        direction: 'ASC',
      },
    ],
  });

  console.log('Pagination object:', JSON.stringify(response.data.pagination, null, 2));
  console.log('Data length:', response.data.data?.length || 0);
  console.log('Total field:', response.data.pagination?.total);
  console.log('Per page:', response.data.pagination?.per_page);
  
  const totalPages = Math.ceil(
    response.data.pagination.total / response.data.pagination.per_page
  );
  console.log('Calculated total pages:', totalPages);
  console.log('Current page:', 1);
  console.log('Has more pages?', 1 < totalPages);
}

testPagination().catch(console.error);

