import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { alphaVantageService } from './alphaVantage.service';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Type for transaction with stock included
interface TransactionWithStock {
  id: number;
  userId: number;
  stockId: number;
  priceBought: Decimal | null;
  createdAt: Date;
  updatedAt: Date;
  stock: {
    id: number;
    symbol: string;
    companyName: string;
    iexId: number | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

// Type for API responses
interface TimeSeriesData {
  'Meta Data'?: Record<string, string>;
  'Time Series (Daily)'?: Record<string, Record<string, string>>;
}

interface PortfolioHolding {
  symbol: string;
  companyName: string;
  shares?: number;
  priceBought: number;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  value: number;
  gain: number;
  gainPercent: number;
}

interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercent: number;
  dayChange: number;
  dayChangePercent: number;
  holdings: PortfolioHolding[];
}

interface PortfolioMetrics {
  // Performance Metrics
  totalReturn: number;
  totalReturnPercent: number;

  // Risk Metrics
  beta: number;
  standardDeviation: number;
  sharpeRatio: number;

  // Diversification
  numberOfHoldings: number;
  topHoldingWeight: number;
  sectorConcentration?: Record<string, number>;
}

interface CorrelationMatrix {
  symbols: string[];
  matrix: number[][];
}

class PortfolioService {
  /**
   * Get portfolio summary with current values and gains
   */
  async getPortfolioSummary(userId: number): Promise<PortfolioSummary> {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { stock: true },
    });

    if (transactions.length === 0) {
      return {
        totalValue: 0,
        totalCost: 0,
        totalGain: 0,
        totalGainPercent: 0,
        dayChange: 0,
        dayChangePercent: 0,
        holdings: [],
      };
    }

    // Fetch current quotes for all holdings in parallel
    const quotePromises = transactions.map(async (t: TransactionWithStock) => {
      try {
        const quote = await alphaVantageService.getQuote(t.stock.symbol);
        return { symbol: t.stock.symbol, quote };
      } catch (error) {
        logger.error(`Failed to fetch quote for ${t.stock.symbol}: ${error}`);
        return { symbol: t.stock.symbol, quote: null };
      }
    });

    const quotes = await Promise.all(quotePromises);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const quoteMap = new Map(quotes.map((q) => [q.symbol, q.quote as any]));

    let totalValue = 0;
    let totalCost = 0;
    let dayChange = 0;

    const holdings: PortfolioHolding[] = transactions.map((t: TransactionWithStock) => {
      const quoteData = quoteMap.get(t.stock.symbol);
      const globalQuote = quoteData?.['Global Quote'] || {};

      const currentPrice = parseFloat(globalQuote['05. price'] || '0');
      const previousClose = parseFloat(globalQuote['08. previous close'] || '0');
      const change = parseFloat(globalQuote['09. change'] || '0');
      const changePercent = parseFloat((globalQuote['10. change percent'] || '0%').replace('%', ''));

      const priceBought = t.priceBought ? parseFloat(t.priceBought.toString()) : 0;
      const shares = 1; // Assuming 1 share per transaction for now
      const value = currentPrice * shares;
      const cost = priceBought * shares;
      const gain = value - cost;
      const gainPercent = cost > 0 ? ((value - cost) / cost) * 100 : 0;

      totalValue += value;
      totalCost += cost;
      dayChange += change * shares;

      return {
        symbol: t.stock.symbol,
        companyName: t.stock.companyName,
        shares,
        priceBought,
        currentPrice,
        previousClose,
        change,
        changePercent,
        value,
        gain,
        gainPercent,
      };
    });

    const totalGain = totalValue - totalCost;
    const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
    const dayChangePercent = totalValue > 0 ? (dayChange / (totalValue - dayChange)) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalGain,
      totalGainPercent,
      dayChange,
      dayChangePercent,
      holdings,
    };
  }

  /**
   * Calculate portfolio risk metrics
   */
  async getPortfolioMetrics(userId: number): Promise<PortfolioMetrics> {
    const summary = await this.getPortfolioSummary(userId);

    if (summary.holdings.length === 0) {
      return {
        totalReturn: 0,
        totalReturnPercent: 0,
        beta: 0,
        standardDeviation: 0,
        sharpeRatio: 0,
        numberOfHoldings: 0,
        topHoldingWeight: 0,
      };
    }

    // Calculate portfolio weights
    const weights = summary.holdings.map((h) => ({
      symbol: h.symbol,
      weight: summary.totalValue > 0 ? h.value / summary.totalValue : 0,
    }));

    // Get historical data for beta calculation
    const historicalDataPromises = summary.holdings.map(async (h) => {
      try {
        const data = await alphaVantageService.getTimeSeriesDaily(h.symbol, 'compact');
        return { symbol: h.symbol, data };
      } catch (error) {
        logger.error(`Failed to fetch historical data for ${h.symbol}: ${error}`);
        return { symbol: h.symbol, data: null };
      }
    });

    const historicalData = await Promise.all(historicalDataPromises);

    // Calculate returns for each stock
    const stockReturns: Record<string, number[]> = {};

    for (const { symbol, data } of historicalData) {
      const tsData = data as TimeSeriesData | null;
      if (tsData && tsData['Time Series (Daily)']) {
        const timeSeries = tsData['Time Series (Daily)'];
        const dates = Object.keys(timeSeries).sort().reverse().slice(0, 30); // Last 30 days
        const returns: number[] = [];

        for (let i = 1; i < dates.length; i++) {
          const todayClose = parseFloat(timeSeries[dates[i]]['4. close']);
          const yesterdayClose = parseFloat(timeSeries[dates[i - 1]]['4. close']);
          const dailyReturn = (todayClose - yesterdayClose) / yesterdayClose;
          returns.push(dailyReturn);
        }

        stockReturns[symbol] = returns;
      }
    }

    // Calculate portfolio beta (vs SPY as market proxy)
    // Simplified: average of individual betas weighted by portfolio weight
    // In production, you'd calculate this properly with market returns
    let portfolioBeta = 1.0; // Default to market beta

    // Calculate portfolio standard deviation
    const portfolioReturns: number[] = [];
    const returnDates = Object.values(stockReturns)[0]?.length || 0;

    for (let i = 0; i < returnDates; i++) {
      let portfolioReturn = 0;
      for (const { symbol, weight } of weights) {
        if (stockReturns[symbol] && stockReturns[symbol][i] !== undefined) {
          portfolioReturn += stockReturns[symbol][i] * weight;
        }
      }
      portfolioReturns.push(portfolioReturn);
    }

    // Calculate standard deviation of portfolio returns
    const avgReturn = portfolioReturns.reduce((a, b) => a + b, 0) / portfolioReturns.length || 0;
    const variance = portfolioReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / portfolioReturns.length || 0;
    const standardDeviation = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized

    // Calculate Sharpe Ratio (assuming 4% risk-free rate)
    const riskFreeRate = 0.04;
    const annualizedReturn = summary.totalGainPercent / 100;
    const sharpeRatio = standardDeviation > 0
      ? (annualizedReturn - riskFreeRate) / (standardDeviation / 100)
      : 0;

    // Top holding weight
    const topHoldingWeight = Math.max(...weights.map((w) => w.weight)) * 100;

    return {
      totalReturn: summary.totalGain,
      totalReturnPercent: summary.totalGainPercent,
      beta: portfolioBeta,
      standardDeviation,
      sharpeRatio,
      numberOfHoldings: summary.holdings.length,
      topHoldingWeight,
    };
  }

  /**
   * Calculate correlation matrix between holdings
   */
  async getCorrelationMatrix(userId: number): Promise<CorrelationMatrix> {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { stock: true },
    });

    if (transactions.length < 2) {
      throw new NotFoundError('Need at least 2 holdings for correlation matrix');
    }

    const symbols = transactions.map((t: TransactionWithStock) => t.stock.symbol);

    // Fetch historical data
    const historicalDataPromises = symbols.map(async (symbol: string) => {
      try {
        const data = await alphaVantageService.getTimeSeriesDaily(symbol, 'compact');
        return { symbol, data };
      } catch (error) {
        logger.error(`Failed to fetch historical data for ${symbol}: ${error}`);
        return { symbol, data: null };
      }
    });

    const historicalData = await Promise.all(historicalDataPromises);

    // Calculate returns for each stock
    const stockReturns: Record<string, number[]> = {};

    for (const { symbol, data } of historicalData) {
      const tsData = data as TimeSeriesData | null;
      if (tsData && tsData['Time Series (Daily)']) {
        const timeSeries = tsData['Time Series (Daily)'];
        const dates = Object.keys(timeSeries).sort().reverse().slice(0, 30);
        const returns: number[] = [];

        for (let i = 1; i < dates.length; i++) {
          const todayClose = parseFloat(timeSeries[dates[i]]['4. close']);
          const yesterdayClose = parseFloat(timeSeries[dates[i - 1]]['4. close']);
          const dailyReturn = (todayClose - yesterdayClose) / yesterdayClose;
          returns.push(dailyReturn);
        }

        stockReturns[symbol] = returns;
      }
    }

    // Calculate correlation matrix
    const matrix: number[][] = [];

    for (let i = 0; i < symbols.length; i++) {
      const row: number[] = [];
      for (let j = 0; j < symbols.length; j++) {
        if (i === j) {
          row.push(1.0);
        } else {
          const corr = this.calculateCorrelation(
            stockReturns[symbols[i]] || [],
            stockReturns[symbols[j]] || []
          );
          row.push(corr);
        }
      }
      matrix.push(row);
    }

    return { symbols, matrix };
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    );

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Get portfolio performance over time
   */
  async getPerformanceHistory(
    userId: number,
    period: '1W' | '1M' | '3M' | '6M' | '1Y' = '1M'
  ): Promise<{ date: string; value: number }[]> {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: { stock: true },
    });

    if (transactions.length === 0) {
      return [];
    }

    // Determine date range
    const days = {
      '1W': 7,
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
    }[period];

    // Fetch historical data for all holdings
    const historicalDataPromises = transactions.map(async (t: TransactionWithStock) => {
      try {
        const data = await alphaVantageService.getTimeSeriesDaily(
          t.stock.symbol,
          days > 100 ? 'full' : 'compact'
        );
        return {
          symbol: t.stock.symbol,
          priceBought: t.priceBought ? parseFloat(t.priceBought.toString()) : 0,
          data
        };
      } catch (error) {
        logger.error(`Failed to fetch historical data for ${t.stock.symbol}: ${error}`);
        return { symbol: t.stock.symbol, priceBought: 0, data: null };
      }
    });

    const historicalData = await Promise.all(historicalDataPromises);

    // Build date-indexed price map for each stock
    const priceMap: Record<string, Record<string, number>> = {};

    for (const { symbol, data } of historicalData) {
      const tsData = data as TimeSeriesData | null;
      if (tsData && tsData['Time Series (Daily)']) {
        priceMap[symbol] = {};
        const timeSeries = tsData['Time Series (Daily)'];
        for (const date of Object.keys(timeSeries)) {
          priceMap[symbol][date] = parseFloat(timeSeries[date]['4. close']);
        }
      }
    }

    // Get common dates
    const allDates = new Set<string>();
    for (const symbol of Object.keys(priceMap)) {
      for (const date of Object.keys(priceMap[symbol])) {
        allDates.add(date);
      }
    }

    const sortedDates = Array.from(allDates)
      .sort()
      .reverse()
      .slice(0, days);

    // Calculate portfolio value for each date
    const performance: { date: string; value: number }[] = [];

    for (const date of sortedDates) {
      let portfolioValue = 0;
      for (const { symbol } of historicalData) {
        if (priceMap[symbol] && priceMap[symbol][date]) {
          portfolioValue += priceMap[symbol][date]; // 1 share each
        }
      }
      if (portfolioValue > 0) {
        performance.push({ date, value: portfolioValue });
      }
    }

    return performance.reverse();
  }
}

export const portfolioService = new PortfolioService();
