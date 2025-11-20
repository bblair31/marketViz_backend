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

  // ==========================================
  // TECHNICAL INDICATORS
  // ==========================================

  /**
   * Get technical indicator data
   * Supports: SMA, EMA, WMA, DEMA, TEMA, TRIMA, KAMA, MAMA, VWAP, T3,
   * MACD, STOCH, RSI, ADX, CCI, AROON, BBANDS, AD, OBV, etc.
   */
  async getTechnicalIndicator(
    symbol: string,
    indicator: string,
    interval: 'daily' | 'weekly' | 'monthly' | '1min' | '5min' | '15min' | '30min' | '60min' = 'daily',
    timePeriod: number = 14,
    seriesType: 'close' | 'open' | 'high' | 'low' = 'close'
  ) {
    const params: Record<string, string> = {
      function: indicator.toUpperCase(),
      symbol: symbol.toUpperCase(),
      interval,
      time_period: timePeriod.toString(),
      series_type: seriesType,
    };

    return this.fetchData(params);
  }

  /**
   * Get RSI (Relative Strength Index)
   */
  async getRSI(
    symbol: string,
    interval: 'daily' | 'weekly' | 'monthly' = 'daily',
    timePeriod: number = 14
  ) {
    return this.getTechnicalIndicator(symbol, 'RSI', interval, timePeriod);
  }

  /**
   * Get MACD (Moving Average Convergence Divergence)
   */
  async getMACD(
    symbol: string,
    interval: 'daily' | 'weekly' | 'monthly' = 'daily',
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
  ) {
    return this.fetchData({
      function: 'MACD',
      symbol: symbol.toUpperCase(),
      interval,
      series_type: 'close',
      fastperiod: fastPeriod.toString(),
      slowperiod: slowPeriod.toString(),
      signalperiod: signalPeriod.toString(),
    });
  }

  /**
   * Get Bollinger Bands
   */
  async getBollingerBands(
    symbol: string,
    interval: 'daily' | 'weekly' | 'monthly' = 'daily',
    timePeriod: number = 20,
    nbdevup: number = 2,
    nbdevdn: number = 2
  ) {
    return this.fetchData({
      function: 'BBANDS',
      symbol: symbol.toUpperCase(),
      interval,
      time_period: timePeriod.toString(),
      series_type: 'close',
      nbdevup: nbdevup.toString(),
      nbdevdn: nbdevdn.toString(),
    });
  }

  /**
   * Get SMA (Simple Moving Average)
   */
  async getSMA(
    symbol: string,
    interval: 'daily' | 'weekly' | 'monthly' = 'daily',
    timePeriod: number = 20
  ) {
    return this.getTechnicalIndicator(symbol, 'SMA', interval, timePeriod);
  }

  /**
   * Get EMA (Exponential Moving Average)
   */
  async getEMA(
    symbol: string,
    interval: 'daily' | 'weekly' | 'monthly' = 'daily',
    timePeriod: number = 20
  ) {
    return this.getTechnicalIndicator(symbol, 'EMA', interval, timePeriod);
  }

  /**
   * Get ADX (Average Directional Index)
   */
  async getADX(
    symbol: string,
    interval: 'daily' | 'weekly' | 'monthly' = 'daily',
    timePeriod: number = 14
  ) {
    return this.getTechnicalIndicator(symbol, 'ADX', interval, timePeriod);
  }

  /**
   * Get Stochastic Oscillator
   */
  async getStochastic(
    symbol: string,
    interval: 'daily' | 'weekly' | 'monthly' = 'daily',
    fastkperiod: number = 5,
    slowkperiod: number = 3,
    slowdperiod: number = 3
  ) {
    return this.fetchData({
      function: 'STOCH',
      symbol: symbol.toUpperCase(),
      interval,
      fastkperiod: fastkperiod.toString(),
      slowkperiod: slowkperiod.toString(),
      slowdperiod: slowdperiod.toString(),
    });
  }

  /**
   * Get ATR (Average True Range)
   */
  async getATR(
    symbol: string,
    interval: 'daily' | 'weekly' | 'monthly' = 'daily',
    timePeriod: number = 14
  ) {
    return this.getTechnicalIndicator(symbol, 'ATR', interval, timePeriod);
  }

  /**
   * Get OBV (On Balance Volume)
   */
  async getOBV(symbol: string, interval: 'daily' | 'weekly' | 'monthly' = 'daily') {
    return this.fetchData({
      function: 'OBV',
      symbol: symbol.toUpperCase(),
      interval,
    });
  }

  // ==========================================
  // FUNDAMENTAL DATA
  // ==========================================

  /**
   * Get income statement
   */
  async getIncomeStatement(symbol: string) {
    return this.fetchData({
      function: 'INCOME_STATEMENT',
      symbol: symbol.toUpperCase(),
    });
  }

  /**
   * Get balance sheet
   */
  async getBalanceSheet(symbol: string) {
    return this.fetchData({
      function: 'BALANCE_SHEET',
      symbol: symbol.toUpperCase(),
    });
  }

  /**
   * Get cash flow statement
   */
  async getCashFlow(symbol: string) {
    return this.fetchData({
      function: 'CASH_FLOW',
      symbol: symbol.toUpperCase(),
    });
  }

  /**
   * Get earnings data
   */
  async getEarnings(symbol: string) {
    return this.fetchData({
      function: 'EARNINGS',
      symbol: symbol.toUpperCase(),
    });
  }

  /**
   * Get earnings calendar
   */
  async getEarningsCalendar(horizon: '3month' | '6month' | '12month' = '3month') {
    return this.fetchData({
      function: 'EARNINGS_CALENDAR',
      horizon,
    });
  }

  /**
   * Get IPO calendar
   */
  async getIPOCalendar() {
    return this.fetchData({
      function: 'IPO_CALENDAR',
    });
  }

  // ==========================================
  // ECONOMIC INDICATORS
  // ==========================================

  /**
   * Get Real GDP
   */
  async getRealGDP(interval: 'annual' | 'quarterly' = 'annual') {
    return this.fetchData({
      function: 'REAL_GDP',
      interval,
    });
  }

  /**
   * Get Treasury Yield
   */
  async getTreasuryYield(
    interval: 'daily' | 'weekly' | 'monthly' = 'monthly',
    maturity: '3month' | '2year' | '5year' | '7year' | '10year' | '30year' = '10year'
  ) {
    return this.fetchData({
      function: 'TREASURY_YIELD',
      interval,
      maturity,
    });
  }

  /**
   * Get Federal Funds Rate
   */
  async getFederalFundsRate(interval: 'daily' | 'weekly' | 'monthly' = 'monthly') {
    return this.fetchData({
      function: 'FEDERAL_FUNDS_RATE',
      interval,
    });
  }

  /**
   * Get CPI (Consumer Price Index / Inflation)
   */
  async getCPI(interval: 'monthly' | 'semiannual' = 'monthly') {
    return this.fetchData({
      function: 'CPI',
      interval,
    });
  }

  /**
   * Get Inflation rate
   */
  async getInflation() {
    return this.fetchData({
      function: 'INFLATION',
    });
  }

  /**
   * Get Retail Sales
   */
  async getRetailSales() {
    return this.fetchData({
      function: 'RETAIL_SALES',
    });
  }

  /**
   * Get Durable Goods Orders
   */
  async getDurableGoods() {
    return this.fetchData({
      function: 'DURABLES',
    });
  }

  /**
   * Get Unemployment Rate
   */
  async getUnemployment() {
    return this.fetchData({
      function: 'UNEMPLOYMENT',
    });
  }

  /**
   * Get Nonfarm Payroll
   */
  async getNonfarmPayroll() {
    return this.fetchData({
      function: 'NONFARM_PAYROLL',
    });
  }

  // ==========================================
  // FOREX
  // ==========================================

  /**
   * Get forex exchange rate
   */
  async getForexRate(fromCurrency: string, toCurrency: string) {
    return this.fetchData({
      function: 'CURRENCY_EXCHANGE_RATE',
      from_currency: fromCurrency.toUpperCase(),
      to_currency: toCurrency.toUpperCase(),
    });
  }

  /**
   * Get forex daily time series
   */
  async getForexDaily(
    fromSymbol: string,
    toSymbol: string,
    outputSize: 'compact' | 'full' = 'compact'
  ) {
    return this.fetchData({
      function: 'FX_DAILY',
      from_symbol: fromSymbol.toUpperCase(),
      to_symbol: toSymbol.toUpperCase(),
      outputsize: outputSize,
    });
  }

  /**
   * Get forex intraday time series
   */
  async getForexIntraday(
    fromSymbol: string,
    toSymbol: string,
    interval: '1min' | '5min' | '15min' | '30min' | '60min' = '5min'
  ) {
    return this.fetchData({
      function: 'FX_INTRADAY',
      from_symbol: fromSymbol.toUpperCase(),
      to_symbol: toSymbol.toUpperCase(),
      interval,
    });
  }

  /**
   * Get forex weekly time series
   */
  async getForexWeekly(fromSymbol: string, toSymbol: string) {
    return this.fetchData({
      function: 'FX_WEEKLY',
      from_symbol: fromSymbol.toUpperCase(),
      to_symbol: toSymbol.toUpperCase(),
    });
  }

  // ==========================================
  // COMMODITIES
  // ==========================================

  /**
   * Get commodity data (WTI, BRENT, NATURAL_GAS, COPPER, ALUMINUM, WHEAT, CORN, COTTON, SUGAR, COFFEE)
   */
  async getCommodity(
    commodity: 'WTI' | 'BRENT' | 'NATURAL_GAS' | 'COPPER' | 'ALUMINUM' | 'WHEAT' | 'CORN' | 'COTTON' | 'SUGAR' | 'COFFEE',
    interval: 'daily' | 'weekly' | 'monthly' = 'monthly'
  ) {
    return this.fetchData({
      function: commodity,
      interval,
    });
  }
}

export const alphaVantageService = new AlphaVantageService();
