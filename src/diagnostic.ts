#!/usr/bin/env node

/**
 * Diagnostic script to inspect raw Nansen API responses
 */

import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.NANSEN_API_KEY || '';
const TEST_WALLET = '0x6313D7948D3491096Ffe00Dea2D246d588b4D4FC';

async function diagnoseAPI() {
  console.log('🔍 Diagnostic Test - Inspecting Nansen API Responses\n');
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

  // Test 1: P&L Summary
  console.log('\n📊 Test 1: P&L Summary');
  console.log('-'.repeat(60));
  try {
    const pnlResponse = await client.post('/api/v1/profiler/address/pnl-summary', {
      address: TEST_WALLET,
      chain: 'all',
      date: {
        from: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString(),
      },
    });
    
    console.log('Status:', pnlResponse.status);
    console.log('Response structure:', JSON.stringify(pnlResponse.data, null, 2));
  } catch (error: any) {
    console.error('Error:', error.response?.status, error.response?.statusText);
    console.error('Error data:', JSON.stringify(error.response?.data, null, 2));
  }

  // Test 2: Labels
  console.log('\n\n🏷️  Test 2: Labels');
  console.log('-'.repeat(60));
  try {
    const labelsResponse = await client.post('/api/beta/profiler/address/labels', {
      parameters: {
        chain: 'all',
        address: TEST_WALLET,
      },
      pagination: {
        page: 1,
        recordsPerPage: 100,
      },
    });
    
    console.log('Status:', labelsResponse.status);
    console.log('Response structure:', JSON.stringify(labelsResponse.data, null, 2));
  } catch (error: any) {
    console.error('Error:', error.response?.status, error.response?.statusText);
    console.error('Error data:', JSON.stringify(error.response?.data, null, 2));
  }

  // Test 3: Current Balance
  console.log('\n\n💰 Test 3: Current Balance');
  console.log('-'.repeat(60));
  try {
    const balanceResponse = await client.post('/api/v1/profiler/address/current-balance', {
      address: TEST_WALLET,
      chain: 'all',
      hide_spam_token: true,
      pagination: {
        page: 1,
        per_page: 10,
      },
    });
    
    console.log('Status:', balanceResponse.status);
    console.log('Response structure:', JSON.stringify(balanceResponse.data, null, 2));
  } catch (error: any) {
    console.error('Error:', error.response?.status, error.response?.statusText);
    console.error('Error data:', JSON.stringify(error.response?.data, null, 2));
  }

  // Test 4: Transactions
  console.log('\n\n📜 Test 4: Transactions');
  console.log('-'.repeat(60));
  try {
    const txResponse = await client.post('/api/v1/profiler/address/transactions', {
      address: TEST_WALLET,
      chain: 'ethereum',
      date: {
        from: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString(),
      },
      pagination: {
        page: 1,
        per_page: 5,
      },
    });
    
    console.log('Status:', txResponse.status);
    console.log('Response structure:', JSON.stringify(txResponse.data, null, 2));
  } catch (error: any) {
    console.error('Error:', error.response?.status, error.response?.statusText);
    console.error('Error data:', JSON.stringify(error.response?.data, null, 2));
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Diagnostic complete\n');
}

diagnoseAPI().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

