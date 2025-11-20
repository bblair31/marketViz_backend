# Claude Development Guide for MarketViz Backend

This document provides context for AI assistants working on this codebase.

## Project Overview

MarketViz is a financial data API backend built with TypeScript, Express, and Prisma. It provides comprehensive market data from AlphaVantage and Finnhub APIs.

## Architecture

### Directory Structure

```
src/
├── config/          # Environment and app configuration
├── middleware/      # Express middleware (auth, logging, errors)
├── routes/          # API route definitions
├── services/        # Business logic and external API integrations
├── utils/           # Utility functions (JWT, bcrypt, errors)
├── validators/      # Zod request validation schemas
├── app.ts           # Express app configuration
└── index.ts         # Entry point
```

### Key Services

- **alphaVantage.service.ts**: Primary market data source (stocks, forex, commodities, indicators)
- **finnhub.service.ts**: Breaking news, social sentiment, insider trading
- **auth.service.ts**: User authentication and registration
- **watchlist.service.ts**: Portfolio/watchlist management
- **cache.service.ts**: In-memory caching (5-minute TTL)

### Data Flow

1. Routes validate requests using Zod schemas
2. Controllers call service methods
3. Services check cache, then call external APIs
4. Results are cached and returned

## Development Commands

```bash
npm run dev          # Development with hot reload
npm run build        # TypeScript compilation
npm test             # Run Jest tests
npm run lint         # ESLint check
npm run db:migrate   # Run Prisma migrations
npm run db:studio    # Open Prisma Studio
```

## Environment Variables

Required:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Min 32 characters
- `ALPHA_VANTAGE_API_KEY`: From alphavantage.co

Optional:
- `FINNHUB_API_KEY`: From finnhub.io (for enhanced news)
- `PORT`: Server port (default: 3000)
- `CORS_ORIGIN`: Allowed origins (comma-separated)

## API Endpoint Categories

### Market Data (`/api/v1/market`)
- **Core**: quotes, time series, search, overview, top movers
- **Technical Indicators**: RSI, MACD, BBANDS, SMA, EMA, ADX, STOCH, ATR, OBV
- **Fundamentals**: income, balance, cashflow, earnings, calendars
- **Forex**: exchange rates, daily/intraday/weekly series
- **Commodities**: WTI, BRENT, NATURAL_GAS, COPPER, etc.

### Economic Data (`/api/v1/economic`)
GDP, treasury yields, fed funds rate, CPI, inflation, unemployment, retail sales, nonfarm payroll

### News (`/api/v1/news`)
Market news, company news, sentiment, social sentiment, insider trading, institutional ownership

### Auth (`/api/v1/auth`)
Register, login, profile

### Watchlist (`/api/v1/watchlist`)
Get/add/remove stocks, watchlist news, search history

## Code Conventions

### Response Format

All endpoints return:
```typescript
{
  status: 'success' | 'error',
  data?: any,
  message?: string
}
```

### Error Handling

Use custom error classes from `utils/errors.ts`:
- `BadRequestError` (400)
- `UnauthorizedError` (401)
- `NotFoundError` (404)
- `ConflictError` (409)
- `ValidationError` (422)
- `InternalServerError` (500)

### Adding New Endpoints

1. Add method to relevant service (e.g., `alphaVantage.service.ts`)
2. Add route in appropriate routes file
3. Use `asyncHandler` wrapper for error handling
4. Validate inputs with Zod if needed
5. Update API.md documentation

### Adding New AlphaVantage Endpoints

```typescript
// In alphaVantage.service.ts
async getNewEndpoint(param: string) {
  return this.fetchData({
    function: 'FUNCTION_NAME',
    param: param.toUpperCase(),
  });
}
```

The `fetchData` method handles:
- Caching (5-minute TTL)
- API key injection
- Error handling
- Rate limit detection

## Testing

Tests are in `src/__tests__/`. Run with:
```bash
npm test                    # All tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

## Database

Using Prisma ORM with PostgreSQL. Schema in `prisma/schema.prisma`.

Models:
- **User**: Authentication and profile
- **Stock**: Stock symbols and company names
- **Transaction**: Watchlist entries with purchase price
- **Search**: User search history

## External APIs

### AlphaVantage
- Free tier: 25 requests/day (500 with premium)
- All market data comes from here
- 5-minute cache reduces API calls

### Finnhub
- Free tier: 60 requests/minute
- Used for breaking news and sentiment
- Optional - falls back to AlphaVantage news

## Feature Roadmap

See `FEATURE_ROADMAP.md` for planned features:
- Stock screener
- Portfolio analytics (Sharpe ratio, Beta, VaR)
- Price alerts
- Backtesting engine

## Common Tasks

### Adding a New Technical Indicator

1. Add method to `alphaVantage.service.ts`
2. Add route to `market.routes.ts`
3. Follow existing pattern (RSI, MACD, etc.)

### Adding Economic Indicator

1. Add method to `alphaVantage.service.ts`
2. Add route to `economic.routes.ts`

### Integrating New External API

1. Create new service in `src/services/`
2. Add API key to `config/env.ts`
3. Create routes file if needed
4. Register routes in `app.ts`

## Performance Notes

- All market data cached for 5 minutes
- Finnhub news cached for 2 minutes
- Watchlist fetches quotes in parallel
- Consider Redis for production scaling

## Security

- JWT tokens expire in 7 days
- Passwords hashed with bcrypt
- Rate limiting: 100 requests per 15 minutes per IP
- Input validation on all endpoints
- Helmet security headers
- CORS configuration
