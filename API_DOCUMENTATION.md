# API Documentation

This document provides details about the Nansen and CoinGecko API integrations used in the Fun Facts POC.

## Nansen API

Base URL: `https://api.nansen.ai`

### Authentication

All Nansen API requests require an API key in the headers:

```
apiKey: YOUR_NANSEN_API_KEY
Content-Type: application/json
```

### Endpoints Used

#### 1. P&L Summary

**Endpoint:** `POST /api/v1/profiler/address/pnl-summary`

**Purpose:** Get realized profit/loss data for a wallet

**Request:**
```json
{
  "address": "0xF977814e90dA44bFA03b6295A0616a897441aceC",
  "chain": "all",
  "date": {
    "from": "2024-09-03T23:44:51.384Z",
    "to": "2025-09-03T23:59:59Z"
  }
}
```

**Response:**
```json
{
  "data": {
    "realized_pnl_usd": 1234.56,
    "realized_pnl_percent": 12.34,
    "unrealized_pnl_usd": 5678.90,
    "unrealized_pnl_percent": 56.78
  }
}
```

#### 2. Wallet Labels

**Endpoint:** `POST /api/beta/profiler/address/labels`

**Purpose:** Get wallet labels/tags from Nansen

**Request:**
```json
{
  "parameters": {
    "chain": "all",
    "address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
  },
  "pagination": {
    "page": 1,
    "recordsPerPage": 100
  }
}
```

**Response:**
```json
{
  "data": {
    "labels": [
      {
        "label": "Whale",
        "labelType": "entity",
        "source": "nansen"
      }
    ]
  }
}
```

#### 3. Current Balance

**Endpoint:** `POST /api/v1/profiler/address/current-balance`

**Purpose:** Get current token holdings for a wallet

**Request:**
```json
{
  "address": "0xF977814e90dA44bFA03b6295A0616a897441aceC",
  "chain": "all",
  "hide_spam_token": true,
  "filters": {
    "value_usd": {
      "min": 5
    }
  },
  "pagination": {
    "page": 1,
    "per_page": 30
  }
}
```

**Response:**
```json
{
  "data": {
    "data": [
      {
        "token_address": "0x...",
        "token_name": "Token Name",
        "token_symbol": "TKN",
        "chain": "ethereum",
        "balance": "1000000000000000000",
        "balance_usd": 1000.00,
        "value_usd": 1000.00,
        "price_usd": 1.00
      }
    ],
    "pagination": {
      "total": 10,
      "page": 1,
      "per_page": 30
    }
  }
}
```

#### 4. Transactions

**Endpoint:** `POST /api/v1/profiler/address/transactions`

**Purpose:** Get transaction history for a wallet

**Request:**
```json
{
  "address": "0xF977814e90dA44bFA03b6295A0616a897441aceC",
  "chain": "ethereum",
  "date": {
    "from": "2024-09-03T23:44:51.384Z",
    "to": "2025-09-03T23:59:59Z"
  },
  "hide_spam_token": true,
  "filters": {
    "volume_usd": {
      "min": 10
    }
  },
  "pagination": {
    "page": 1,
    "per_page": 100
  },
  "order_by": [
    {
      "field": "block_timestamp",
      "direction": "ASC"
    }
  ]
}
```

**Response:**
```json
{
  "data": {
    "data": [
      {
        "block_timestamp": "2025-01-01T00:00:00Z",
        "transaction_hash": "0x...",
        "chain": "ethereum",
        "from_address": "0x...",
        "to_address": "0x...",
        "token_address": "0x...",
        "token_name": "Token Name",
        "token_symbol": "TKN",
        "amount": "1000000000000000000",
        "amount_usd": 1000.00,
        "type": "buy",
        "volume_usd": 1000.00
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "per_page": 100
    }
  }
}
```

#### 5. Token Screener

**Endpoint:** `POST /api/v1/token-screener`

**Purpose:** Screen tokens for specific criteria (e.g., low liquidity)

**Request:**
```json
{
  "chains": ["ethereum", "polygon", "bnb", "arbitrum", "avalanche"],
  "date": {
    "from": "2024-09-03T23:44:51.384Z",
    "to": "2025-09-03T23:59:59Z"
  },
  "watchlistFilter": ["0xdac17f958d2ee523a2206206994597c13d831ec7"],
  "filters": {
    "liquidity": {
      "from": 0,
      "to": 10000
    }
  },
  "pagination": {
    "page": 1,
    "per_page": 10
  },
  "order": {
    "orderBy": "liquidity",
    "order": "asc"
  }
}
```

**Response:**
```json
{
  "data": {
    "items": [
      {
        "token_address": "0x...",
        "token_name": "Token Name",
        "token_symbol": "TKN",
        "chain": "ethereum",
        "liquidity": 5000.00,
        "liquidity_usd": 5000.00
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "per_page": 10
    }
  }
}
```

## CoinGecko API

Base URL: `https://api.coingecko.com/api/v3`

### Authentication

CoinGecko API can be used without authentication (free tier) or with an API key for higher rate limits.

### Endpoints Used

#### 1. Historical Price

**Endpoint:** `GET /coins/{id}/history`

**Purpose:** Get historical price for a specific date

**Request:**
```
GET /coins/ethereum/history?date=03-09-2025&vs_currencies=usd
```

**Parameters:**
- `date`: Format `dd-mm-yyyy`
- `vs_currencies`: Target currency (e.g., `usd`)

**Response:**
```json
{
  "id": "ethereum",
  "symbol": "eth",
  "name": "Ethereum",
  "market_data": {
    "current_price": {
      "usd": 2500.00
    }
  }
}
```

#### 2. Current Price

**Endpoint:** `GET /simple/price`

**Purpose:** Get current price for one or more coins

**Request:**
```
GET /simple/price?ids=ethereum&vs_currencies=usd
```

**Parameters:**
- `ids`: Comma-separated coin IDs
- `vs_currencies`: Target currency

**Response:**
```json
{
  "ethereum": {
    "usd": 2500.00
  }
}
```

#### 3. Market Chart (for ATH)

**Endpoint:** `GET /coins/{platform}/contract/{address}/market_chart`

**Purpose:** Get price history for a token contract

**Request:**
```
GET /coins/ethereum/contract/0x...address.../market_chart?vs_currency=usd&days=365
```

**Parameters:**
- `platform`: Blockchain platform (e.g., `ethereum`, `polygon-pos`)
- `address`: Token contract address
- `vs_currency`: Target currency
- `days`: Number of days of history

**Response:**
```json
{
  "prices": [
    [1625097600000, 2000.00],
    [1625184000000, 2100.00]
  ],
  "market_caps": [...],
  "total_volumes": [...]
}
```

## Chain Mappings

The POC maps chain names from Nansen to CoinGecko platform IDs:

| Nansen Chain | CoinGecko Platform |
|--------------|-------------------|
| ethereum     | ethereum          |
| polygon      | polygon-pos       |
| bnb / bsc    | binance-smart-chain |
| arbitrum     | arbitrum-one      |
| avalanche    | avalanche         |
| optimism     | optimistic-ethereum |

## Error Handling

All API calls in the POC include:
1. Try-catch blocks for network errors
2. Response validation
3. Graceful degradation with fallback values
4. Error logging for debugging

## Rate Limiting

### Nansen
- Rate limits depend on API plan
- The POC handles errors gracefully

### CoinGecko
- Free tier: 10-50 calls/minute
- The POC includes delays between batch requests
- Failed requests return fallback values (0 or empty)

## Testing APIs

You can test the APIs directly using the provided curl commands in the main documentation or using tools like Postman.

Example curl command:
```bash
curl --location 'https://api.nansen.ai/api/v1/profiler/address/pnl-summary' \
  --header 'apiKey: YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "address": "0xF977814e90dA44bFA03b6295A0616a897441aceC",
    "chain": "all",
    "date": {
      "from": "2024-09-03T23:44:51.384Z",
      "to": "2025-09-03T23:59:59Z"
    }
  }'
```

