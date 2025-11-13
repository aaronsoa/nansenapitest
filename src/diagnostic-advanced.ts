#!/usr/bin/env node

/**
 * Advanced diagnostic script to check ETH Benchmark and Portfolio ATH
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import { subMonths } from 'date-fns';

dotenv.config();

const API_KEY = process.env.NANSEN_API_KEY || '';
const TEST_WALLET = '0x6313D7948D3491096Ffe00Dea2D246d588b4D4FC';

async function diagnoseAdvanced() {
  console.log('🔍 Advanced Diagnostic - ETH Benchmark & Portfolio ATH\n');
  console.log(`Wallet: ${TEST_WALLET}\n`);
  console.log('='.repeat(60));

  const client = axios.create({
    baseURL: 'https://api.nansen.ai',
    headers: {
      'apiKey': API_KEY,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // Test 1: Transactions for ETH Benchmark (6 months)
  console.log('\n📜 Test 1: Recent Transactions (6 months) for ETH Benchmark');
  console.log('-'.repeat(60));
  try {
    const now = new Date();
    const fromDate = subMonths(now, 6);
    
    const txResponse = await client.post('/api/v1/profiler/address/transactions', {
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
        per_page: 10,
      },
      order_by: [
        {
          field: 'block_timestamp',
          direction: 'ASC',
        },
      ],
    });
    
    console.log('Status:', txResponse.status);
    console.log('Total transactions:', txResponse.data.pagination?.total || 0);
    console.log('Transactions in response:', txResponse.data.data?.length || 0);
    
    if (txResponse.data.data && txResponse.data.data.length > 0) {
      console.log('\nFirst transaction:');
      const firstTx = txResponse.data.data[0];
      console.log('  Date:', firstTx.block_timestamp);
      console.log('  Volume USD:', firstTx.volume_usd);
      console.log('  Tokens sent:', firstTx.tokens_sent?.length || 0);
      console.log('  Tokens received:', firstTx.tokens_received?.length || 0);
    }
  } catch (error: any) {
    console.error('Error:', error.response?.status, error.response?.statusText);
    console.error('Error data:', JSON.stringify(error.response?.data, null, 2));
  }

  // Test 2: Current Balance for Portfolio ATH
  console.log('\n\n💰 Test 2: Current Balance (for Portfolio ATH)');
  console.log('-'.repeat(60));
  try {
    const balanceResponse = await client.post('/api/v1/profiler/address/current-balance', {
      address: TEST_WALLET,
      chain: 'all',
      hide_spam_token: true,
      pagination: {
        page: 1,
        per_page: 30,
      },
      order_by: [
        {
          field: 'value_usd',
          direction: 'DESC',
        },
      ],
    });
    
    console.log('Status:', balanceResponse.status);
    console.log('Total holdings:', balanceResponse.data.pagination?.total || 0);
    console.log('Holdings in response:', balanceResponse.data.data?.length || 0);
    
    if (balanceResponse.data.data && balanceResponse.data.data.length > 0) {
      console.log('\nTop 5 holdings:');
      const top5 = balanceResponse.data.data.slice(0, 5);
      top5.forEach((holding: any, index: number) => {
        console.log(`  ${index + 1}. ${holding.token_symbol} (${holding.chain})`);
        console.log(`     Amount: ${holding.token_amount}`);
        console.log(`     Value: $${holding.value_usd?.toFixed(2) || 0}`);
        console.log(`     Address: ${holding.token_address}`);
      });
    }
  } catch (error: any) {
    console.error('Error:', error.response?.status, error.response?.statusText);
    console.error('Error data:', JSON.stringify(error.response?.data, null, 2));
  }

  // Test 3: Check if transactions have type field
  console.log('\n\n🔍 Test 3: Transaction Type Analysis');
  console.log('-'.repeat(60));
  try {
    const now = new Date();
    const fromDate = subMonths(now, 6);
    
    const txResponse = await client.post('/api/v1/profiler/address/transactions', {
      address: TEST_WALLET,
      chain: 'ethereum',
      date: {
        from: fromDate.toISOString(),
        to: now.toISOString(),
      },
      pagination: {
        page: 1,
        per_page: 5,
      },
    });
    
    if (txResponse.data.data && txResponse.data.data.length > 0) {
      console.log('Checking transaction structure:');
      const firstTx = txResponse.data.data[0];
      console.log('  Has "type" field?', 'type' in firstTx);
      console.log('  Has "method" field?', 'method' in firstTx);
      console.log('  Has "tokens_sent" field?', 'tokens_sent' in firstTx);
      console.log('  Has "tokens_received" field?', 'tokens_received' in firstTx);
      console.log('\nFull transaction structure:');
      console.log(JSON.stringify(firstTx, null, 2));
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Advanced diagnostic complete\n');
}

diagnoseAdvanced().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

