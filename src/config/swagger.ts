import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MarketViz API',
      version: '2.0.0',
      description: `
Modern TypeScript backend API for MarketViz - A financial portfolio visualization and stock market research application.

## Features
- 🔐 JWT Authentication
- 📊 Real-time Stock Data (Alpha Vantage)
- 💼 Portfolio Management
- 📰 Market News & Sentiment Analysis
- 🔍 Symbol Search
- ⚡ Smart Caching
- 🛡️ Security (Helmet, CORS, Rate Limiting)
      `,
      contact: {
        name: 'API Support',
        url: 'https://github.com/bblair31/marketViz_backend',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/v1`,
        description: 'Development server',
      },
      {
        url: 'https://your-production-url.com/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from /auth/login or /auth/register',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            username: { type: 'string', example: 'johndoe' },
            email: { type: 'string', example: 'john@example.com' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Stock: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            symbol: { type: 'string', example: 'AAPL' },
            companyName: { type: 'string', example: 'Apple Inc.' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 1 },
            stockId: { type: 'integer', example: 1 },
            priceBought: { type: 'number', format: 'decimal', example: 150.5 },
            createdAt: { type: 'string', format: 'date-time' },
            stock: { $ref: '#/components/schemas/Stock' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'error' },
            message: { type: 'string', example: 'Error description' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'success' },
            data: { type: 'object' },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token is missing or invalid',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                status: 'error',
                message: 'Invalid or expired token',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                status: 'error',
                message: 'Resource not found',
              },
            },
          },
        },
        ValidationError: {
          description: 'Invalid input data',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                status: 'error',
                message: 'Validation failed',
              },
            },
          },
        },
        RateLimitError: {
          description: 'Too many requests',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                status: 'error',
                message: 'Too many requests from this IP, please try again later.',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and registration',
      },
      {
        name: 'Watchlist',
        description: 'Portfolio and watchlist management (requires authentication)',
      },
      {
        name: 'Market Data',
        description: 'Stock market data endpoints (public)',
      },
      {
        name: 'Health',
        description: 'Server health and status',
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
