import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';
import { InternalServerError } from '../utils/errors';
import { logger } from '../utils/logger';
import { cacheService } from './cache.service';

interface FinnhubNewsItem {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

interface FinnhubCompanyNews {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

class FinnhubService {
  private client: AxiosInstance;
  private readonly apiKey: string;

  constructor() {
    this.apiKey = config.finnhub?.apiKey || '';
    this.client = axios.create({
      baseURL: 'https://finnhub.io/api/v1',
      timeout: 10000,
    });
  }

  /**
   * Check if Finnhub is configured
   */
  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Generic method to fetch data from Finnhub
   */
  private async fetchData<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    if (!this.isConfigured()) {
      throw new InternalServerError('Finnhub API key is not configured');
    }

    const cacheKey = `finnhub:${endpoint}:${JSON.stringify(params)}`;
    const cached = cacheService.get<T>(cacheKey);

    if (cached) {
      logger.debug(`Cache HIT for ${cacheKey}`);
      return cached;
    }

    try {
      const response = await this.client.get<T>(endpoint, {
        params: {
          ...params,
          token: this.apiKey,
        },
      });

      // Cache for 2 minutes (shorter than AlphaVantage due to real-time nature)
      cacheService.set(cacheKey, response.data, 120);

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Finnhub API error: ${error.message}`);
        if (error.response?.status === 429) {
          throw new InternalServerError('Finnhub API rate limit reached. Please try again later.');
        }
        throw new InternalServerError('Failed to fetch news data from Finnhub');
      }
      throw error;
    }
  }

  /**
   * Get general market news
   * Categories: general, forex, crypto, merger
   */
  async getMarketNews(category: 'general' | 'forex' | 'crypto' | 'merger' = 'general'): Promise<FinnhubNewsItem[]> {
    return this.fetchData<FinnhubNewsItem[]>('/news', { category });
  }

  /**
   * Get company-specific news
   */
  async getCompanyNews(
    symbol: string,
    from: string, // YYYY-MM-DD
    to: string // YYYY-MM-DD
  ): Promise<FinnhubCompanyNews[]> {
    return this.fetchData<FinnhubCompanyNews[]>('/company-news', {
      symbol: symbol.toUpperCase(),
      from,
      to,
    });
  }

  /**
   * Get news sentiment for a symbol
   */
  async getNewsSentiment(symbol: string) {
    return this.fetchData('/news-sentiment', {
      symbol: symbol.toUpperCase(),
    });
  }

  /**
   * Get market status
   */
  async getMarketStatus(exchange: string = 'US') {
    return this.fetchData('/stock/market-status', { exchange });
  }

  /**
   * Get basic financials (P/E, market cap, etc.)
   */
  async getBasicFinancials(symbol: string, metric: string = 'all') {
    return this.fetchData('/stock/metric', {
      symbol: symbol.toUpperCase(),
      metric,
    });
  }

  /**
   * Get insider transactions
   */
  async getInsiderTransactions(symbol: string) {
    return this.fetchData('/stock/insider-transactions', {
      symbol: symbol.toUpperCase(),
    });
  }

  /**
   * Get institutional ownership
   */
  async getInstitutionalOwnership(symbol: string) {
    return this.fetchData('/institutional/ownership', {
      symbol: symbol.toUpperCase(),
    });
  }

  /**
   * Get social sentiment
   */
  async getSocialSentiment(symbol: string) {
    return this.fetchData('/stock/social-sentiment', {
      symbol: symbol.toUpperCase(),
    });
  }
}

export const finnhubService = new FinnhubService();
