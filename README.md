# MarketViz Backend 📊

A modern, TypeScript-based backend API for MarketViz - a financial portfolio visualization and stock market research application.

![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-4.18-lightgrey)
![Prisma](https://img.shields.io/badge/Prisma-5.8-2D3748)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791)

## 🚀 Features

### Core Features
- **Modern TypeScript Stack**: Built with TypeScript, Express, and Prisma ORM
- **JWT Authentication**: Secure user authentication with JSON Web Tokens
- **Portfolio Management**: Track stocks, transactions, and build watchlists
- **Portfolio Analytics**: Sharpe ratio, correlation matrix, beta, performance tracking
- **Stock Screener**: Screen stocks by PE, PB, market cap, dividends, growth metrics
- **Price Alerts**: Set alerts for price targets with ABOVE/BELOW conditions
- **Smart Caching**: In-memory caching to optimize API calls and reduce costs

### Market Data
- **Technical Indicators**: RSI, MACD, Bollinger Bands, SMA, EMA, ADX, Stochastic, ATR, OBV
- **Fundamental Data**: Income statements, balance sheets, cash flow, earnings
- **Economic Indicators**: GDP, inflation, CPI, unemployment, treasury yields, fed funds rate
- **Forex Trading**: Exchange rates, daily/intraday/weekly time series
- **Commodities**: Oil (WTI/Brent), natural gas, metals, agricultural

### News & Sentiment
- **AlphaVantage News**: Market news with sentiment analysis
- **Finnhub Integration**: Real-time breaking news, social sentiment, insider trading

### Developer Experience
- **Input Validation**: Comprehensive request validation using Zod
- **Error Handling**: Centralized error handling with custom error classes
- **Rate Limiting**: Built-in rate limiting to protect against abuse
- **Security**: Helmet, CORS, and bcrypt for secure operations
- **Testing**: Unit and integration tests with Jest
- **Code Quality**: ESLint and Prettier for consistent code style

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 14
- **npm** >= 9.0.0
- **Alpha Vantage API Key** (free at [alphavantage.co](https://www.alphavantage.co/support/#api-key))

## 🛠️ Installation

1. **Clone the repository**

```bash
git clone https://github.com/bblair31/marketViz_backend.git
cd marketViz_backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/marketviz_development

# JWT Configuration (use a strong secret in production!)
JWT_SECRET=your_jwt_secret_here_min_32_characters_long

# Alpha Vantage API
ALPHA_VANTAGE_API_KEY=your_api_key_here

# Finnhub API (optional - for breaking news)
FINNHUB_API_KEY=your_finnhub_key_here

# CORS Configuration
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
```

> **Note**: Get a free Finnhub API key at [finnhub.io](https://finnhub.io) (60 calls/min free tier). If not configured, news endpoints fall back to AlphaVantage.

4. **Set up the database**

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed the database (optional)
npm run db:seed
```

## 🏃 Running the Application

### Development Mode (with hot reload)

```bash
npm run dev
```

### Production Mode

```bash
# Build the application
npm run build

# Start the server
npm start
```

The server will start at `http://localhost:3000` (or your configured PORT).

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication Routes

#### Register a new user

```http
POST /auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**

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

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Profile (requires authentication)

```http
GET /auth/profile
Authorization: Bearer <your_jwt_token>
```

### Watchlist Routes (all require authentication)

#### Get Watchlist

```http
GET /watchlist
Authorization: Bearer <your_jwt_token>
```

Returns user's watchlist with current stock prices.

#### Add Stock to Watchlist

```http
POST /watchlist
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "symbol": "AAPL",
  "companyName": "Apple Inc.",
  "priceBought": 150.50
}
```

#### Remove Stock from Watchlist

```http
DELETE /watchlist/:symbol
Authorization: Bearer <your_jwt_token>
```

#### Get Watchlist News

```http
GET /watchlist/news
Authorization: Bearer <your_jwt_token>
```

Returns news articles for all stocks in your watchlist.

#### Get Search History

```http
GET /watchlist/searches?limit=10
Authorization: Bearer <your_jwt_token>
```

### Market Data Routes

#### Core Data
- `GET /market/quote/:symbol` - Real-time stock quote
- `GET /market/daily/:symbol` - Daily time series
- `GET /market/intraday/:symbol` - Intraday data
- `GET /market/search?q=apple` - Symbol search
- `GET /market/overview/:symbol` - Company overview
- `GET /market/top-movers` - Top gainers/losers
- `GET /market/news` - Market news with sentiment
- `GET /market/crypto/:symbol` - Cryptocurrency quote

#### Technical Indicators
- `GET /market/indicators/:symbol?indicator=RSI` - Any indicator
- `GET /market/indicators/:symbol/rsi` - RSI
- `GET /market/indicators/:symbol/macd` - MACD
- `GET /market/indicators/:symbol/bbands` - Bollinger Bands
- `GET /market/indicators/:symbol/sma` - Simple Moving Average
- `GET /market/indicators/:symbol/ema` - Exponential Moving Average
- `GET /market/indicators/:symbol/adx` - Average Directional Index
- `GET /market/indicators/:symbol/stoch` - Stochastic Oscillator
- `GET /market/indicators/:symbol/atr` - Average True Range
- `GET /market/indicators/:symbol/obv` - On Balance Volume

#### Fundamental Data
- `GET /market/fundamentals/:symbol/income` - Income statement
- `GET /market/fundamentals/:symbol/balance` - Balance sheet
- `GET /market/fundamentals/:symbol/cashflow` - Cash flow
- `GET /market/fundamentals/:symbol/earnings` - Earnings data
- `GET /market/calendar/earnings` - Earnings calendar
- `GET /market/calendar/ipo` - IPO calendar

#### Forex
- `GET /market/forex/rate?from=EUR&to=USD` - Exchange rate
- `GET /market/forex/daily?from=EUR&to=USD` - Daily forex
- `GET /market/forex/intraday?from=EUR&to=USD` - Intraday forex
- `GET /market/forex/weekly?from=EUR&to=USD` - Weekly forex

#### Commodities
- `GET /market/commodities/:commodity` - WTI, BRENT, NATURAL_GAS, COPPER, etc.

### Economic Indicators Routes
- `GET /economic/gdp` - Real GDP
- `GET /economic/treasury-yield` - Treasury yields
- `GET /economic/federal-funds-rate` - Fed funds rate
- `GET /economic/cpi` - Consumer Price Index
- `GET /economic/inflation` - Inflation rate
- `GET /economic/unemployment` - Unemployment rate
- `GET /economic/retail-sales` - Retail sales
- `GET /economic/nonfarm-payroll` - Nonfarm payroll

### News Routes (Finnhub + AlphaVantage)
- `GET /news/market` - Breaking market news
- `GET /news/company/:symbol` - Company-specific news
- `GET /news/sentiment/:symbol` - News sentiment
- `GET /news/social/:symbol` - Social media sentiment
- `GET /news/insider/:symbol` - Insider transactions
- `GET /news/institutional/:symbol` - Institutional ownership

### Health Check

```http
GET /health
```

Returns server health status.

## 🗄️ Database Schema

### User

- `id`: Integer (Primary Key)
- `username`: String (Unique)
- `email`: String (Unique)
- `passwordHash`: String
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Stock

- `id`: Integer (Primary Key)
- `symbol`: String (Unique)
- `companyName`: String
- `iexId`: Integer (Optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Transaction

- `id`: Integer (Primary Key)
- `userId`: Integer (Foreign Key -> User)
- `stockId`: Integer (Foreign Key -> Stock)
- `priceBought`: Decimal (Optional)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### Search

- `id`: Integer (Primary Key)
- `userId`: Integer (Foreign Key -> User)
- `searchTerm`: String
- `createdAt`: DateTime
- `updatedAt`: DateTime

## 🏗️ Project Structure

```
marketViz_backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── __tests__/             # Test files
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── config/                # Configuration files
│   │   └── env.ts             # Environment validation
│   ├── controllers/           # Route controllers
│   ├── database/              # Database client and seeds
│   │   ├── client.ts
│   │   └── seed.ts
│   ├── middleware/            # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── requestLogger.ts
│   │   └── validate.ts
│   ├── routes/                # API routes
│   │   ├── auth.routes.ts
│   │   ├── market.routes.ts
│   │   ├── watchlist.routes.ts
│   │   ├── economic.routes.ts
│   │   └── news.routes.ts
│   ├── services/              # Business logic
│   │   ├── alphaVantage.service.ts
│   │   ├── finnhub.service.ts
│   │   ├── auth.service.ts
│   │   ├── cache.service.ts
│   │   └── watchlist.service.ts
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   │   ├── asyncHandler.ts
│   │   ├── bcrypt.ts
│   │   ├── errors.ts
│   │   ├── jwt.ts
│   │   └── logger.ts
│   ├── validators/            # Request validators
│   │   ├── auth.validator.ts
│   │   └── watchlist.validator.ts
│   ├── app.ts                 # Express app configuration
│   └── index.ts               # Entry point
├── .env.example               # Environment variables template
├── .eslintrc.json             # ESLint configuration
├── .prettierrc.json           # Prettier configuration
├── jest.config.js             # Jest configuration
├── package.json
├── tsconfig.json              # TypeScript configuration
└── README.md
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed the database
- `npm run db:studio` - Open Prisma Studio

## 🔐 Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Helmet**: Security headers
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevent API abuse
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Prisma ORM parameterized queries

## 🎯 Future Enhancements

- [ ] Stock screener with technical + fundamental filters
- [ ] Portfolio analytics (Sharpe ratio, Beta, VaR)
- [ ] Price alerts and notifications
- [ ] Backtesting engine
- [ ] WebSocket support for real-time price updates
- [ ] Redis caching for better performance
- [ ] Two-factor authentication
- [ ] GraphQL API
- [ ] Docker containerization
- [ ] CI/CD pipeline

See [FEATURE_ROADMAP.md](FEATURE_ROADMAP.md) for detailed feature plans.

## 📝 License

MIT

## 👤 Author

[@bblair31](https://github.com/bblair31)

## 🙏 Acknowledgments

- [Alpha Vantage](https://www.alphavantage.co/) for stock market data
- [Prisma](https://www.prisma.io/) for the amazing ORM
- [Express](https://expressjs.com/) for the web framework

## 🔗 Related Projects

- [MarketViz Frontend](https://github.com/bblair31/marketViz_frontend) - React frontend for MarketViz

---

**Demo Account** (after running `npm run db:seed`):
- Email: `demo@marketviz.com`
- Password: `password123`
