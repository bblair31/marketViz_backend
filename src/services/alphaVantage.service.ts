import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';
import { InternalServerError } from '../utils/errors';
import { logger } from '../utils/logger';
import { cacheService } from './cache.service';

class AlphaVantageService {
  private client: AxiosInstance;
  private readonly apiKey: string;

  constructor() {
    this.apiKey = config.alphaVantage.apiKey;
    this.client = axios.create({
      baseURL: config.alphaVantage.baseUrl,
      timeout: 10000,
    });
  }

  /**
   * Generic method to fetch data from Alpha Vantage
   */
  private async fetchData<T>(params: Record<string, string>): Promise<T> {
    const cacheKey = `av:${JSON.stringify(params)}`;
    const cached = cacheService.get<T>(cacheKey);

    if (cached) {
      logger.debug(`Cache HIT for ${cacheKey}`);
      return cached;
    }

    try {
      const response = await this.client.get<T>('', {
        params: {
          ...params,
          apikey: this.apiKey,
        },
      });

      // Check for Alpha Vantage API errors
      const data = response.data as any;
      if (data['Error Message']) {
        throw new InternalServerError(`Alpha Vantage API error: ${data['Error Message']}`);
      }

      if (data['Note']) {
        // API rate limit message
        throw new InternalServerError('API rate limit reached. Please try again later.');
      }

      // Cache for 5 minutes
      cacheService.set(cacheKey, response.data, 300);

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Alpha Vantage API error: ${error.message}`);
        throw new InternalServerError('Failed to fetch stock data');
      }
      throw error;
    }
  }

  /**
   * Get real-time quote for a symbol
   */
  async getQuote(symbol: string) {
    return this.fetchData({
      function: 'GLOBAL_QUOTE',
      symbol: symbol.toUpperCase(),
    });
  }

  /**
   * Get time series data (daily)
   */
  async getTimeSeriesDaily(symbol: string, outputSize: 'compact' | 'full' = 'compact') {
    return this.fetchData({
      function: 'TIME_SERIES_DAILY',
      symbol: symbol.toUpperCase(),
      outputsize: outputSize,
    });
  }

  /**
   * Get intraday data
   */
  async getTimeSeriesIntraday(
    symbol: string,
    interval: '1min' | '5min' | '15min' | '30min' | '60min' = '5min'
  ) {
    return this.fetchData({
      function: 'TIME_SERIES_INTRADAY',
      symbol: symbol.toUpperCase(),
      interval,
    });
  }

  /**
   * Search for symbols
   */
  async searchSymbols(keywords: string) {
    return this.fetchData({
      function: 'SYMBOL_SEARCH',
      keywords,
    });
  }

  /**
   * Get company overview
   */
  async getCompanyOverview(symbol: string) {
    return this.fetchData({
      function: 'OVERVIEW',
      symbol: symbol.toUpperCase(),
    });
  }

  /**
   * Get top gainers/losers
   */
  async getTopGainersLosers() {
    return this.fetchData({
      function: 'TOP_GAINERS_LOSERS',
    });
  }

  /**
   * Get news sentiment
   */
  async getNewsSentiment(tickers?: string, limit: number = 50) {
    const params: Record<string, string> = {
      function: 'NEWS_SENTIMENT',
      limit: limit.toString(),
    };

    if (tickers) {
      params.tickers = tickers;
    }

    return this.fetchData(params);
  }

  /**
   * Get cryptocurrency quote
   */
  async getCryptoQuote(symbol: string, market: string = 'USD') {
    return this.fetchData({
      function: 'CURRENCY_EXCHANGE_RATE',
      from_currency: symbol.toUpperCase(),
      to_currency: market.toUpperCase(),
    });
  }
}

export const alphaVantageService = new AlphaVantageService();
