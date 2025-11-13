# MarketViz Backend 📊

A modern, TypeScript-based backend API for MarketViz - a financial portfolio visualization and stock market research application.

![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-4.18-lightgrey)
![Prisma](https://img.shields.io/badge/Prisma-5.8-2D3748)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791)

## 🚀 Features

- **Modern TypeScript Stack**: Built with TypeScript, Express, and Prisma ORM
- **JWT Authentication**: Secure user authentication with JSON Web Tokens
- **Real-time Stock Data**: Integration with Alpha Vantage API for live market data
- **Portfolio Management**: Track stocks, transactions, and build watchlists
- **Smart Caching**: In-memory caching to optimize API calls and reduce costs
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

# CORS Configuration
CORS_ORIGIN=http://localhost:3001,http://localhost:3000
```

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

#### Get Stock Quote

```http
GET /market/quote/:symbol
```

Example: `GET /market/quote/AAPL`

#### Get Daily Time Series

```http
GET /market/daily/:symbol?outputsize=compact
```

Query parameters:
- `outputsize`: `compact` (100 data points) or `full` (20+ years)

#### Get Intraday Data

```http
GET /market/intraday/:symbol?interval=5min
```

Query parameters:
- `interval`: `1min`, `5min`, `15min`, `30min`, `60min`

#### Search Symbols

```http
GET /market/search?q=apple
```

#### Get Company Overview

```http
GET /market/overview/:symbol
```

#### Get Top Gainers/Losers

```http
GET /market/top-movers
```

#### Get Market News

```http
GET /market/news?tickers=AAPL,GOOGL&limit=50
```

Query parameters:
- `tickers`: Comma-separated stock symbols (optional)
- `limit`: Number of articles (default: 50)

#### Get Cryptocurrency Quote

```http
GET /market/crypto/:symbol?market=USD
```

Example: `GET /market/crypto/BTC?market=USD`

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
│   │   └── watchlist.routes.ts
│   ├── services/              # Business logic
│   │   ├── alphaVantage.service.ts
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

- [ ] WebSocket support for real-time price updates
- [ ] Redis caching for better performance
- [ ] Email notifications
- [ ] Two-factor authentication
- [ ] Advanced portfolio analytics
- [ ] GraphQL API
- [ ] Swagger/OpenAPI documentation
- [ ] Docker containerization
- [ ] CI/CD pipeline

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
