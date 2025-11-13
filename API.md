# MarketViz API Documentation

Complete API reference for the MarketViz Backend.

## Table of Contents

- [Authentication](#authentication)
- [Error Responses](#error-responses)
- [Rate Limiting](#rate-limiting)
- [Authentication Endpoints](#authentication-endpoints)
- [Watchlist Endpoints](#watchlist-endpoints)
- [Market Data Endpoints](#market-data-endpoints)

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens are valid for 7 days and can be obtained through the `/auth/register` or `/auth/login` endpoints.

## Error Responses

All errors follow this format:

```json
{
  "status": "error",
  "message": "Error description here"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (resource already exists)
- `422` - Validation Error
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per IP address
- Headers included in response:
  - `RateLimit-Limit`: Maximum requests allowed
  - `RateLimit-Remaining`: Requests remaining
  - `RateLimit-Reset`: Time when limit resets

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint**: `POST /api/v1/auth/register`

**Request Body**:
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation Rules**:
- `username`: 3-50 characters, alphanumeric and underscores only
- `email`: Valid email format
- `password`: Minimum 6 characters

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
- `422` - Validation error

---

### Login

Authenticate existing user.

**Endpoint**: `POST /api/v1/auth/login`

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

**Error Responses**:
- `401` - Invalid credentials
- `422` - Validation error

---

### Get Profile

Get current user's profile information.

**Endpoint**: `GET /api/v1/auth/profile`

**Authentication**: Required

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

## Watchlist Endpoints

All watchlist endpoints require authentication.

### Get Watchlist

Retrieve user's watchlist with current stock prices.

**Endpoint**: `GET /api/v1/watchlist`

**Authentication**: Required

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
      "stock": {
        "id": 1,
        "symbol": "AAPL",
        "companyName": "Apple Inc."
      },
      "currentQuote": {
        "Global Quote": {
          "01. symbol": "AAPL",
          "05. price": "182.50",
          "09. change": "2.30",
          "10. change percent": "1.27%"
        }
      }
    }
  ]
}
```

---

### Add to Watchlist

Add a stock to user's watchlist.

**Endpoint**: `POST /api/v1/watchlist`

**Authentication**: Required

**Request Body**:
```json
{
  "symbol": "AAPL",
  "companyName": "Apple Inc.",
  "priceBought": 150.50
}
```

**Validation Rules**:
- `symbol`: Required, converted to uppercase
- `companyName`: Required
- `priceBought`: Optional, positive number

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

### Remove from Watchlist

Remove a stock from user's watchlist.

**Endpoint**: `DELETE /api/v1/watchlist/:symbol`

**Authentication**: Required

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

**Error Responses**:
- `404` - Stock not found in watchlist

---

### Get Watchlist News

Get news articles for stocks in user's watchlist.

**Endpoint**: `GET /api/v1/watchlist/news`

**Authentication**: Required

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
        "ticker_sentiment": [
          {
            "ticker": "AAPL",
            "sentiment_score": "0.8"
          }
        ]
      }
    ]
  }
}
```

---

### Get Search History

Get user's recent stock searches.

**Endpoint**: `GET /api/v1/watchlist/searches`

**Authentication**: Required

**Query Parameters**:
- `limit`: Number of results (default: 10)

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

## Market Data Endpoints

These endpoints proxy data from Alpha Vantage API.

### Get Stock Quote

Get real-time quote for a stock symbol.

**Endpoint**: `GET /api/v1/market/quote/:symbol`

**URL Parameters**:
- `symbol`: Stock symbol (e.g., "AAPL")

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

### Get Daily Time Series

Get daily historical price data.

**Endpoint**: `GET /api/v1/market/daily/:symbol`

**URL Parameters**:
- `symbol`: Stock symbol

**Query Parameters**:
- `outputsize`: `compact` (100 days) or `full` (20+ years)

**Success Response** (200):
```json
{
  "status": "success",
  "data": {
    "Meta Data": {
      "1. Information": "Daily Prices",
      "2. Symbol": "AAPL"
    },
    "Time Series (Daily)": {
      "2025-01-15": {
        "1. open": "180.00",
        "2. high": "183.50",
        "3. low": "179.50",
        "4. close": "182.50",
        "5. volume": "50123456"
      }
    }
  }
}
```

---

### Get Intraday Data

Get intraday price data.

**Endpoint**: `GET /api/v1/market/intraday/:symbol`

**URL Parameters**:
- `symbol`: Stock symbol

**Query Parameters**:
- `interval`: `1min`, `5min`, `15min`, `30min`, `60min`

---

### Search Symbols

Search for stock symbols by keywords.

**Endpoint**: `GET /api/v1/market/search`

**Query Parameters**:
- `q`: Search query (required)

**Authentication**: Optional (searches are logged if authenticated)

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
      }
    ]
  }
}
```

---

### Get Company Overview

Get detailed company information.

**Endpoint**: `GET /api/v1/market/overview/:symbol`

**URL Parameters**:
- `symbol`: Stock symbol

**Success Response** (200):
```json
{
  "status": "success",
  "data": {
    "Symbol": "AAPL",
    "Name": "Apple Inc.",
    "Description": "Apple Inc. designs, manufactures...",
    "Sector": "Technology",
    "Industry": "Consumer Electronics",
    "MarketCapitalization": "2800000000000",
    "PERatio": "28.5",
    "DividendYield": "0.0055",
    "52WeekHigh": "199.62",
    "52WeekLow": "124.17"
  }
}
```

---

### Get Top Gainers/Losers

Get top performing stocks.

**Endpoint**: `GET /api/v1/market/top-movers`

**Success Response** (200):
```json
{
  "status": "success",
  "data": {
    "top_gainers": [...],
    "top_losers": [...],
    "most_actively_traded": [...]
  }
}
```

---

### Get Market News

Get latest market news.

**Endpoint**: `GET /api/v1/market/news`

**Query Parameters**:
- `tickers`: Comma-separated symbols (optional)
- `limit`: Number of articles (default: 50)

**Success Response** (200):
```json
{
  "status": "success",
  "data": {
    "feed": [...]
  }
}
```

---

### Get Cryptocurrency Quote

Get cryptocurrency exchange rate.

**Endpoint**: `GET /api/v1/market/crypto/:symbol`

**URL Parameters**:
- `symbol`: Crypto symbol (e.g., "BTC")

**Query Parameters**:
- `market`: Target currency (default: "USD")

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
      "5. Exchange Rate": "42150.50000000"
    }
  }
}
```

## Caching

Market data endpoints are cached for 5 minutes to reduce API calls and improve performance. Subsequent requests within the cache window will return cached data.

## Notes

- All timestamps are in ISO 8601 format (UTC)
- Decimal values (prices) are returned as strings to preserve precision
- Symbol parameters are case-insensitive and converted to uppercase
- The Alpha Vantage free tier allows 500 requests per day
