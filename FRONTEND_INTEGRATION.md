# Frontend Integration Guide

This document provides everything you need to integrate the modernized MarketViz backend with the frontend.

## Backend Tech Stack
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens (7-day expiration)
- **API**: Alpha Vantage for stock market data
- **Port**: 3000 (configurable via `PORT` env var)

---

## Base Configuration

### API Base URL
```
Development: http://localhost:3000/api/v1
Production: [Your deployment URL]/api/v1
```

### CORS Configuration
The backend accepts requests from:
- `http://localhost:3000`
- `http://localhost:3001`
- Configurable via `CORS_ORIGIN` environment variable

---

## Authentication Flow

### 1. Registration
**Endpoint**: `POST /auth/register`

**Request Body**:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response** (201):
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "createdAt": "2025-01-15T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses**:
- `409` - Email or username already exists
- `422` - Validation error (password < 6 chars, invalid email, etc.)

---

### 2. Login
**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response** (200):
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "createdAt": "2025-01-15T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response**:
- `401` - Invalid credentials

---

### 3. Using JWT Tokens

**Store the token** on successful login/registration, then include it in all protected requests:

```
Authorization: Bearer <token>
```

**Token Details**:
- Expires in 7 days
- Contains: `{ userId, username, email }`
- Error if expired: `401` with message "Token has expired"
- Error if invalid: `401` with message "Invalid token"

---

### 4. Get User Profile
**Endpoint**: `GET /auth/profile`

**Headers**: `Authorization: Bearer <token>`

**Success Response** (200):
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "_count": {
      "transactions": 5,
      "searches": 12
    }
  }
}
```

---

## Watchlist Endpoints (All require authentication)

### Get Watchlist with Live Prices
**Endpoint**: `GET /watchlist`

**Headers**: `Authorization: Bearer <token>`

**Success Response** (200):
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "userId": 1,
      "stockId": 1,
      "priceBought": "150.50",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z",
      "stock": {
        "id": 1,
        "symbol": "AAPL",
        "companyName": "Apple Inc.",
        "createdAt": "2025-01-15T10:00:00.000Z"
      },
      "currentQuote": {
        "Global Quote": {
          "01. symbol": "AAPL",
          "02. open": "180.00",
          "03. high": "183.50",
          "04. low": "179.50",
          "05. price": "182.50",
          "06. volume": "50123456",
          "07. latest trading day": "2025-01-15",
          "08. previous close": "180.20",
          "09. change": "2.30",
          "10. change percent": "1.27%"
        }
      }
    }
  ]
}
```

**Note**: If quote fetching fails for a stock, `currentQuote` will be `null`.

---

### Add Stock to Watchlist
**Endpoint**: `POST /watchlist`

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "symbol": "AAPL",
  "companyName": "Apple Inc.",
  "priceBought": 150.50
}
```

**Fields**:
- `symbol` (required): Stock ticker symbol
- `companyName` (required): Company name
- `priceBought` (optional): Purchase price in dollars

**Success Response** (201):
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "userId": 1,
    "stockId": 1,
    "priceBought": "150.50",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "stock": {
      "id": 1,
      "symbol": "AAPL",
      "companyName": "Apple Inc."
    }
  }
}
```

**Error Responses**:
- `400` - Stock already in watchlist
- `422` - Validation error

---

### Remove Stock from Watchlist
**Endpoint**: `DELETE /watchlist/:symbol`

**Headers**: `Authorization: Bearer <token>`

**URL Parameters**:
- `symbol`: Stock symbol (e.g., "AAPL")

**Success Response** (200):
```json
{
  "status": "success",
  "data": {
    "message": "Stock removed from watchlist"
  }
}
```

**Error Response**:
- `404` - Stock not found in watchlist

---

### Get Watchlist News
**Endpoint**: `GET /watchlist/news`

**Headers**: `Authorization: Bearer <token>`

**Success Response** (200):
```json
{
  "status": "success",
  "data": {
    "feed": [
      {
        "title": "Apple announces new product",
        "url": "https://...",
        "time_published": "20250115T120000",
        "summary": "...",
        "source": "CNBC",
        "banner_image": "https://...",
        "ticker_sentiment": [
          {
            "ticker": "AAPL",
            "relevance_score": "0.9",
            "ticker_sentiment_score": "0.8",
            "ticker_sentiment_label": "Bullish"
          }
        ]
      }
    ]
  }
}
```

---

### Get Search History
**Endpoint**: `GET /watchlist/searches?limit=10`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `limit` (optional): Number of results (default: 10)

**Success Response** (200):
```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "userId": 1,
      "searchTerm": "AAPL",
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

---

## Market Data Endpoints (Public - No Auth Required)

### Get Stock Quote
**Endpoint**: `GET /market/quote/:symbol`

**Example**: `GET /market/quote/AAPL`

**Success Response** (200):
```json
{
  "status": "success",
  "data": {
    "Global Quote": {
      "01. symbol": "AAPL",
      "02. open": "180.00",
      "03. high": "183.50",
      "04. low": "179.50",
      "05. price": "182.50",
      "06. volume": "50123456",
      "07. latest trading day": "2025-01-15",
      "08. previous close": "180.20",
      "09. change": "2.30",
      "10. change percent": "1.27%"
    }
  }
}
```

---

### Get Daily Historical Data
**Endpoint**: `GET /market/daily/:symbol?outputsize=compact`

**Query Parameters**:
- `outputsize`: `compact` (100 days, default) or `full` (20+ years)

**Example**: `GET /market/daily/AAPL?outputsize=compact`

**Success Response** (200):
```json
{
  "status": "success",
  "data": {
    "Meta Data": {
      "1. Information": "Daily Prices (open, high, low, close) and Volumes",
      "2. Symbol": "AAPL",
      "3. Last Refreshed": "2025-01-15",
      "4. Output Size": "Compact",
      "5. Time Zone": "US/Eastern"
    },
    "Time Series (Daily)": {
      "2025-01-15": {
        "1. open": "180.00",
        "2. high": "183.50",
        "3. low": "179.50",
        "4. close": "182.50",
        "5. volume": "50123456"
      },
      "2025-01-14": {
        "1. open": "178.00",
        "2. high": "181.00",
        "3. low": "177.50",
        "4. close": "180.20",
        "5. volume": "48123456"
      }
    }
  }
}
```

---

### Get Intraday Data
**Endpoint**: `GET /market/intraday/:symbol?interval=5min`

**Query Parameters**:
- `interval`: `1min`, `5min`, `15min`, `30min`, `60min` (default: `5min`)

**Example**: `GET /market/intraday/AAPL?interval=15min`

---

### Search Symbols
**Endpoint**: `GET /market/search?q=apple`

**Query Parameters**:
- `q` (required): Search query

**Headers** (optional): `Authorization: Bearer <token>` (searches are logged if authenticated)

**Success Response** (200):
```json
{
  "status": "success",
  "data": {
    "bestMatches": [
      {
        "1. symbol": "AAPL",
        "2. name": "Apple Inc.",
        "3. type": "Equity",
        "4. region": "United States",
        "5. marketOpen": "09:30",
        "6. marketClose": "16:00",
        "7. timezone": "UTC-05",
        "8. currency": "USD",
        "9. matchScore": "1.0000"
      },
      {
        "1. symbol": "APLE",
        "2. name": "Apple Hospitality REIT Inc.",
        "3. type": "Equity",
        "4. region": "United States",
        "5. marketOpen": "09:30",
        "6. marketClose": "16:00",
        "7. timezone": "UTC-05",
        "8. currency": "USD",
        "9. matchScore": "0.7500"
      }
    ]
  }
}
```

---

### Get Company Overview
**Endpoint**: `GET /market/overview/:symbol`

**Example**: `GET /market/overview/AAPL`

**Success Response** (200):
```json
{
  "status": "success",
  "data": {
    "Symbol": "AAPL",
    "AssetType": "Common Stock",
    "Name": "Apple Inc.",
    "Description": "Apple Inc. designs, manufactures, and markets smartphones...",
    "Exchange": "NASDAQ",
    "Currency": "USD",
    "Country": "USA",
    "Sector": "Technology",
    "Industry": "Consumer Electronics",
    "Address": "One Apple Park Way, Cupertino, CA, United States",
    "MarketCapitalization": "2800000000000",
    "EBITDA": "130000000000",
    "PERatio": "28.5",
    "PEGRatio": "2.5",
    "BookValue": "4.2",
    "DividendPerShare": "0.96",
    "DividendYield": "0.0055",
    "EPS": "6.42",
    "52WeekHigh": "199.62",
    "52WeekLow": "124.17",
    "50DayMovingAverage": "185.50",
    "200DayMovingAverage": "175.20"
  }
}
```

---

### Get Top Gainers/Losers
**Endpoint**: `GET /market/top-movers`

**Success Response** (200):
```json
{
  "status": "success",
  "data": {
    "metadata": "...",
    "last_updated": "2025-01-15 16:00:00 US/Eastern",
    "top_gainers": [
      {
        "ticker": "TSLA",
        "price": "250.50",
        "change_amount": "12.30",
        "change_percentage": "5.16%",
        "volume": "45123456"
      }
    ],
    "top_losers": [
      {
        "ticker": "META",
        "price": "320.50",
        "change_amount": "-8.30",
        "change_percentage": "-2.52%",
        "volume": "35123456"
      }
    ],
    "most_actively_traded": [
      {
        "ticker": "AAPL",
        "price": "182.50",
        "change_amount": "2.30",
        "change_percentage": "1.27%",
        "volume": "80123456"
      }
    ]
  }
}
```

---

### Get Market News
**Endpoint**: `GET /market/news?tickers=AAPL,GOOGL&limit=50`

**Query Parameters**:
- `tickers` (optional): Comma-separated stock symbols
- `limit` (optional): Number of articles (default: 50)

**Success Response** (200):
```json
{
  "status": "success",
  "data": {
    "feed": [
      {
        "title": "Tech stocks rally...",
        "url": "https://...",
        "time_published": "20250115T120000",
        "authors": ["John Doe"],
        "summary": "...",
        "banner_image": "https://...",
        "source": "CNBC",
        "category_within_source": "Technology",
        "source_domain": "cnbc.com",
        "topics": [
          {
            "topic": "Technology",
            "relevance_score": "1.0"
          }
        ],
        "overall_sentiment_score": 0.5,
        "overall_sentiment_label": "Bullish",
        "ticker_sentiment": [
          {
            "ticker": "AAPL",
            "relevance_score": "0.9",
            "ticker_sentiment_score": "0.8",
            "ticker_sentiment_label": "Bullish"
          }
        ]
      }
    ]
  }
}
```

---

### Get Cryptocurrency Quote
**Endpoint**: `GET /market/crypto/:symbol?market=USD`

**URL Parameters**:
- `symbol`: Crypto symbol (e.g., "BTC", "ETH")

**Query Parameters**:
- `market` (optional): Target currency (default: "USD")

**Example**: `GET /market/crypto/BTC?market=USD`

**Success Response** (200):
```json
{
  "status": "success",
  "data": {
    "Realtime Currency Exchange Rate": {
      "1. From_Currency Code": "BTC",
      "2. From_Currency Name": "Bitcoin",
      "3. To_Currency Code": "USD",
      "4. To_Currency Name": "United States Dollar",
      "5. Exchange Rate": "42150.50000000",
      "6. Last Refreshed": "2025-01-15 12:30:00",
      "7. Time Zone": "UTC",
      "8. Bid Price": "42145.00000000",
      "9. Ask Price": "42155.00000000"
    }
  }
}
```

---

## Error Response Format

All errors follow this consistent format:

```json
{
  "status": "error",
  "message": "Error description here"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created (e.g., new user, new watchlist entry)
- `400` - Bad Request (invalid input, resource already exists)
- `401` - Unauthorized (missing/invalid/expired token)
- `403` - Forbidden
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource, e.g., email already registered)
- `422` - Validation Error (invalid data format)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Rate Limiting

- **Window**: 15 minutes (900,000ms)
- **Max Requests**: 100 per IP address
- **Response when exceeded**: 429 status with message "Too many requests from this IP, please try again later."

**Rate Limit Headers** (included in all responses):
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: <timestamp>
```

---

## Data Caching

Market data endpoints are **cached for 5 minutes** to reduce API calls to Alpha Vantage and improve performance.

**Cached Endpoints**:
- All `/market/*` endpoints
- `/watchlist` (for quote data)
- `/watchlist/news`

**Not Cached**:
- Authentication endpoints
- Watchlist CRUD operations (add/remove)

---

## Important Notes for Frontend

### 1. Alpha Vantage Data Format
Alpha Vantage returns data with numbered keys (e.g., `"01. symbol"`, `"1. open"`). You'll need to parse these:

```javascript
// Example parsing
const quote = data["Global Quote"];
const symbol = quote["01. symbol"];
const price = quote["05. price"];
const change = quote["09. change"];
const changePercent = quote["10. change percent"];
```

### 2. Token Storage
Store JWT tokens securely:
- **localStorage** for persistence (user stays logged in)
- **sessionStorage** for session-only
- Consider using `httpOnly` cookies if you control deployment

### 3. Token Expiration Handling
Tokens expire after 7 days. Handle 401 errors:

```javascript
if (response.status === 401) {
  // Clear stored token
  localStorage.removeItem('token');
  // Redirect to login
  navigate('/login');
}
```

### 4. API Request Helper (Example)

```javascript
const API_BASE_URL = 'http://localhost:3000/api/v1';

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }

  const data = await response.json();

  if (data.status === 'error') {
    throw new Error(data.message);
  }

  return data.data;
}

// Usage examples
const user = await apiRequest('/auth/profile');
const watchlist = await apiRequest('/watchlist');
const quote = await apiRequest('/market/quote/AAPL');
```

### 5. Environment Variables Needed

Create `.env` file in frontend:

```env
REACT_APP_API_BASE_URL=http://localhost:3000/api/v1
# or
VITE_API_BASE_URL=http://localhost:3000/api/v1  # for Vite
# or
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1  # for Next.js
```

### 6. WebSocket Support
**Now Implemented!** See [WebSocket Integration](#websocket-integration) section below.

### 7. Demo Account (After Seeding)
```
Email: demo@marketviz.com
Password: password123
```

---

## API Changes from Original Rails Backend

### Breaking Changes

1. **Base URL**: Changed from `/` to `/api/v1/`
2. **IEX API → Alpha Vantage**: Different data structure
3. **Endpoints Removed/Changed**:
   - ❌ `/markets` - Removed (use `/market/top-movers`)
   - ❌ `/mostactive`, `/gainers`, `/losers` - Consolidated into `/market/top-movers`
   - ❌ `/marketnews` - Changed to `/market/news`
   - ❌ `/chart/:symbol/:timeframe` - Changed to `/market/daily/:symbol` or `/market/intraday/:symbol`
   - ❌ `/peers/:symbol` - Not available in Alpha Vantage free tier
   - ❌ `/financials/:symbol` - Use `/market/overview/:symbol` instead
   - ❌ `/companyinfo/:symbol` - Changed to `/market/overview/:symbol`
   - ❌ `/logo/:symbol` - Not available (use company name for logo services)
   - ❌ `/earnings/:symbol` - Not in free tier
   - ❌ `/keystats/:symbol` - Use `/market/overview/:symbol` instead

4. **New Endpoints**:
   - ✅ `/auth/profile` - Get user profile
   - ✅ `/watchlist/searches` - Get search history
   - ✅ `/market/search` - Search for symbols
   - ✅ `/market/top-movers` - Consolidated gainers/losers/active

5. **Response Format**: All responses now wrapped in:
   ```json
   {
     "status": "success",
     "data": { ... }
   }
   ```

6. **Authentication**: Header format unchanged (`Bearer <token>`)

---

## Testing the API

### Health Check
```bash
curl http://localhost:3000/health
```

### Register User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Get Quote (No Auth)
```bash
curl http://localhost:3000/api/v1/market/quote/AAPL
```

### Get Watchlist (With Auth)
```bash
curl http://localhost:3000/api/v1/watchlist \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Need Help?

- **Backend Repo**: https://github.com/bblair31/marketViz_backend
- **API Documentation**: See `API.md` in backend repo
- **README**: See `README.md` in backend repo

---

**Last Updated**: November 2025 (Major feature expansion)

---

## New Features (November 2025)

### Dependencies

```bash
npm install socket.io-client
```

---

## Portfolio Analytics Endpoints

All require `Authorization: Bearer <token>` header.

### Get Portfolio Summary
**Endpoint**: `GET /portfolio/summary`

Returns holdings with current values and gains.

```typescript
interface PortfolioSummary {
  holdings: Array<{
    symbol: string;
    companyName: string;
    priceBought: number;
    currentPrice: number;
    change: number;
    changePercent: number;
    gain: number;
    gainPercent: number;
  }>;
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
}
```

### Get Portfolio Metrics
**Endpoint**: `GET /portfolio/metrics`

Returns risk metrics.

```typescript
interface PortfolioMetrics {
  sharpeRatio: number;
  standardDeviation: number;
  beta: number;
  diversificationScore: number;
}
```

### Get Correlation Matrix
**Endpoint**: `GET /portfolio/correlation`

```typescript
interface CorrelationMatrix {
  symbols: string[];
  matrix: number[][];  // NxN correlation values
}
```

### Get Performance History
**Endpoint**: `GET /portfolio/performance?period=1M`

Periods: `1W`, `1M`, `3M`, `6M`, `1Y`

```typescript
interface PerformanceData {
  date: string;
  value: number;
}[]
```

---

## Stock Screener Endpoints

### Screen Stocks
**Endpoint**: `POST /screener`

```typescript
// Request
interface ScreenerRequest {
  filters: {
    peRatio?: { min?: number; max?: number };
    pbRatio?: { min?: number; max?: number };
    pegRatio?: { min?: number; max?: number };
    marketCap?: { min?: number; max?: number };
    dividendYield?: { min?: number; max?: number };
    profitMargin?: { min?: number; max?: number };
    revenueGrowth?: { min?: number; max?: number };
    beta?: { min?: number; max?: number };
    sector?: string;
  };
  symbols?: string[];  // Defaults to 100-stock universe
  limit?: number;      // Default 20
}

// Response
interface ScreenerResult {
  symbol: string;
  name: string;
  sector: string;
  peRatio: number | null;
  pbRatio: number | null;
  marketCap: number | null;
  dividendYield: number | null;
  profitMargin: number | null;
  beta: number | null;
}
```

### Get Presets
**Endpoint**: `GET /screener/presets`

Returns available presets: `value_stocks`, `growth_stocks`, `dividend_aristocrats`, `large_cap_tech`, `low_volatility`, `high_momentum`

### Run Preset
**Endpoint**: `GET /screener/presets/:preset?limit=20`

### Get Sectors
**Endpoint**: `GET /screener/sectors`

---

## Price Alerts Endpoints

All require authentication.

### Create Alert
**Endpoint**: `POST /alerts`

```typescript
interface CreateAlert {
  symbol: string;
  condition: 'ABOVE' | 'BELOW' | 'CROSSES_ABOVE' | 'CROSSES_BELOW';
  targetPrice: number;
  note?: string;
}
```

### List Alerts
**Endpoint**: `GET /alerts?status=ACTIVE`

Status filter: `ACTIVE`, `TRIGGERED`, `CANCELLED`

### Get Alert Stats
**Endpoint**: `GET /alerts/stats`

```typescript
interface AlertStats {
  active: number;
  triggered: number;
  cancelled: number;
  total: number;
}
```

### Check Alerts
**Endpoint**: `POST /alerts/check`

Checks all active alerts against current prices and returns which triggered.

### Update Alert
**Endpoint**: `PUT /alerts/:id`

### Cancel Alert
**Endpoint**: `POST /alerts/:id/cancel`

### Delete Alert
**Endpoint**: `DELETE /alerts/:id`

---

## Technical Indicators

All follow pattern: `GET /market/indicators/:symbol/:indicator`

| Indicator | Endpoint | Extra Params |
|-----------|----------|--------------|
| RSI | `/market/indicators/:symbol/rsi` | interval, period |
| MACD | `/market/indicators/:symbol/macd` | fast_period, slow_period, signal_period |
| Bollinger | `/market/indicators/:symbol/bbands` | period, nbdevup, nbdevdn |
| SMA | `/market/indicators/:symbol/sma` | period |
| EMA | `/market/indicators/:symbol/ema` | period |
| ADX | `/market/indicators/:symbol/adx` | period |
| Stochastic | `/market/indicators/:symbol/stoch` | - |
| ATR | `/market/indicators/:symbol/atr` | period |
| OBV | `/market/indicators/:symbol/obv` | - |

Common params: `interval` (daily/weekly/monthly), `period` (default 14)

---

## Fundamental Data

| Endpoint | Description |
|----------|-------------|
| `/market/fundamentals/:symbol/income` | Income statement |
| `/market/fundamentals/:symbol/balance` | Balance sheet |
| `/market/fundamentals/:symbol/cashflow` | Cash flow |
| `/market/fundamentals/:symbol/earnings` | Earnings |
| `/market/calendar/earnings` | Upcoming earnings |
| `/market/calendar/ipo` | Upcoming IPOs |

---

## Economic Indicators

| Endpoint | Description |
|----------|-------------|
| `/economic/gdp?interval=annual` | GDP |
| `/economic/treasury-yield?maturity=10year` | Treasury yields |
| `/economic/federal-funds-rate` | Fed funds rate |
| `/economic/cpi` | Consumer Price Index |
| `/economic/inflation` | Inflation rate |
| `/economic/unemployment` | Unemployment rate |
| `/economic/retail-sales` | Retail sales |
| `/economic/nonfarm-payroll` | Nonfarm payroll |

---

## Forex & Commodities

### Forex
| Endpoint | Example |
|----------|---------|
| `/market/forex/rate?from=EUR&to=USD` | Exchange rate |
| `/market/forex/daily?from=EUR&to=USD` | Daily history |
| `/market/forex/intraday?from=EUR&to=USD&interval=5min` | Intraday |

### Commodities
`GET /market/commodities/:commodity?interval=monthly`

Commodities: `WTI`, `BRENT`, `NATURAL_GAS`, `COPPER`, `ALUMINUM`, `WHEAT`, `CORN`, `COTTON`, `SUGAR`, `COFFEE`

---

## News & Sentiment

| Endpoint | Description | Requires Finnhub |
|----------|-------------|------------------|
| `/news/market?category=general` | Market news | Optional |
| `/news/company/:symbol` | Company news | Optional |
| `/news/sentiment/:symbol` | Sentiment analysis | No |
| `/news/social/:symbol` | Social media | Yes |
| `/news/insider/:symbol` | Insider trades | Yes |
| `/news/institutional/:symbol` | Institutional ownership | Yes |
| `/news/market-status` | Market open/closed | Yes |

---

## WebSocket Integration

### Installation
```bash
npm install socket.io-client
```

### Connection
```typescript
import { io, Socket } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('jwt_token')
  }
});

socket.on('connected', (data) => {
  console.log('Connected:', data.socketId);
  console.log('Authenticated:', data.authenticated);
});
```

### Subscribe to Prices
```typescript
// Subscribe (max 20 symbols)
socket.emit('subscribe:prices', {
  symbols: ['AAPL', 'MSFT', 'GOOGL']
});

// Listen for updates (every 30 seconds)
socket.on('price:update', (data) => {
  // { symbol, price, change, changePercent, volume, timestamp }
  updatePriceDisplay(data.symbol, data.price);
});

// Unsubscribe
socket.emit('unsubscribe:prices', { symbols: ['AAPL'] });
```

### Subscribe to Alerts
```typescript
socket.emit('subscribe:alerts');

socket.on('alert:triggered', (alert) => {
  // { id, symbol, condition, targetPrice, currentPrice, triggeredAt }
  showNotification(`${alert.symbol} alert triggered at $${alert.currentPrice}`);
});
```

### Subscribe to Portfolio
```typescript
socket.emit('subscribe:portfolio');

socket.on('portfolio:update', (data) => {
  // { totalValue, totalGain, totalGainPercent, dayChange, dayChangePercent }
  updatePortfolioCard(data);
});
```

### Cleanup
```typescript
// On component unmount
useEffect(() => {
  return () => socket.disconnect();
}, []);
```

---

## Suggested UI Components

### New Pages
- **Portfolio Dashboard** - metrics cards, performance chart, correlation heatmap
- **Stock Screener** - filter form, results table, preset buttons
- **Alerts Manager** - create/list/edit alerts, triggered history
- **Economic Dashboard** - GDP, CPI, unemployment charts

### Real-time Components
- **Live Ticker** - WebSocket price streaming
- **Alert Toast** - show on `alert:triggered` event
- **Portfolio Value Card** - WebSocket updates

### Charts Needed
- Line chart for performance history
- Heatmap for correlation matrix
- Candlestick with indicator overlays (RSI, MACD, Bollinger)

---

## Database Migration Required

The price alerts feature requires a new database table. Run:

```bash
npx prisma migrate dev --name add-price-alerts
```

---

## Quick Reference: All New Endpoints

| Category | Endpoints |
|----------|-----------|
| Portfolio | `/portfolio/summary`, `/portfolio/metrics`, `/portfolio/correlation`, `/portfolio/performance` |
| Screener | `/screener`, `/screener/presets`, `/screener/presets/:preset`, `/screener/sectors` |
| Alerts | `/alerts`, `/alerts/:id`, `/alerts/:id/cancel`, `/alerts/check`, `/alerts/stats` |
| Indicators | `/market/indicators/:symbol/:indicator` (rsi, macd, bbands, sma, ema, adx, stoch, atr, obv) |
| Fundamentals | `/market/fundamentals/:symbol/:type` (income, balance, cashflow, earnings) |
| Calendars | `/market/calendar/earnings`, `/market/calendar/ipo` |
| Economic | `/economic/gdp`, `/economic/treasury-yield`, `/economic/federal-funds-rate`, `/economic/cpi`, `/economic/inflation`, `/economic/unemployment`, `/economic/retail-sales`, `/economic/nonfarm-payroll` |
| Forex | `/market/forex/rate`, `/market/forex/daily`, `/market/forex/intraday`, `/market/forex/weekly` |
| Commodities | `/market/commodities/:commodity` |
| News | `/news/market`, `/news/company/:symbol`, `/news/sentiment/:symbol`, `/news/social/:symbol`, `/news/insider/:symbol`, `/news/institutional/:symbol`, `/news/market-status` |
| WebSocket | `/websocket/stats`, `/websocket/health` |
