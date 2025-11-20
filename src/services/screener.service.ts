import { alphaVantageService } from './alphaVantage.service';
import { logger } from '../utils/logger';

interface ScreenerFilters {
  // Valuation
  pe_ratio?: { min?: number; max?: number };
  pb_ratio?: { min?: number; max?: number };
  peg_ratio?: { min?: number; max?: number };

  // Size
  market_cap?: { min?: number; max?: number };

  // Dividends
  dividend_yield?: { min?: number; max?: number };

  // Profitability
  profit_margin?: { min?: number; max?: number };
  operating_margin?: { min?: number; max?: number };
  roe?: { min?: number; max?: number };

  // Growth
  revenue_growth?: { min?: number; max?: number };
  earnings_growth?: { min?: number; max?: number };

  // Technical
  rsi_14?: { min?: number; max?: number };
  above_sma_50?: boolean;
  above_sma_200?: boolean;

  // Price
  price?: { min?: number; max?: number };
  change_percent?: { min?: number; max?: number };

  // Other
  sector?: string;
  beta?: { min?: number; max?: number };
}

interface ScreenerResult {
  symbol: string;
  name: string;
  sector?: string;
  industry?: string;
  marketCap?: number;
  peRatio?: number;
  pbRatio?: number;
  dividendYield?: number;
  profitMargin?: number;
  roe?: number;
  price?: number;
  changePercent?: number;
  beta?: number;
}

interface ScreenerResponse {
  results: ScreenerResult[];
  total: number;
  filters_applied: string[];
}

// Popular stock universe for screening (top traded stocks)
const STOCK_UNIVERSE = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'UNH', 'JNJ',
  'V', 'XOM', 'WMT', 'JPM', 'MA', 'PG', 'HD', 'CVX', 'MRK', 'ABBV',
  'LLY', 'PEP', 'KO', 'COST', 'AVGO', 'TMO', 'MCD', 'CSCO', 'ACN', 'DHR',
  'ABT', 'NKE', 'NEE', 'VZ', 'ADBE', 'TXN', 'PM', 'CMCSA', 'WFC', 'BMY',
  'COP', 'RTX', 'UPS', 'HON', 'ORCL', 'QCOM', 'T', 'IBM', 'GE', 'CAT',
  'INTC', 'AMD', 'BA', 'SBUX', 'GS', 'MS', 'BLK', 'SCHW', 'AXP', 'SPGI',
  'PLD', 'DE', 'GILD', 'SYK', 'MMC', 'ADP', 'MDLZ', 'ADI', 'ISRG', 'CVS',
  'TJX', 'BKNG', 'CI', 'CB', 'AMT', 'SO', 'DUK', 'NOC', 'LMT', 'MO',
  'ZTS', 'PNC', 'USB', 'TFC', 'C', 'CL', 'ITW', 'EOG', 'SLB', 'EMR',
  'FDX', 'F', 'GM', 'DAL', 'UAL', 'AAL', 'LUV', 'MAR', 'HLT', 'ABNB'
];

class ScreenerService {
  /**
   * Screen stocks based on filters
   */
  async screenStocks(
    filters: ScreenerFilters,
    symbols: string[] = STOCK_UNIVERSE,
    limit: number = 20
  ): Promise<ScreenerResponse> {
    const filtersApplied: string[] = [];
    const results: ScreenerResult[] = [];

    // Build filter list for response
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined) {
        filtersApplied.push(key);
      }
    }

    // Fetch company data for all symbols in parallel (in batches to avoid rate limits)
    const batchSize = 5;
    const batches: string[][] = [];

    for (let i = 0; i < symbols.length; i += batchSize) {
      batches.push(symbols.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const promises = batch.map(async (symbol) => {
        try {
          const overview = await alphaVantageService.getCompanyOverview(symbol);
          return { symbol, overview };
        } catch (error) {
          logger.debug(`Failed to fetch overview for ${symbol}: ${error}`);
          return { symbol, overview: null };
        }
      });

      const batchResults = await Promise.all(promises);

      for (const { symbol, overview } of batchResults) {
        if (!overview || Object.keys(overview).length === 0) continue;

        // Apply filters
        const data = overview as Record<string, string>;

        // Parse values
        const peRatio = parseFloat(data['PERatio']) || undefined;
        const pbRatio = parseFloat(data['PriceToBookRatio']) || undefined;
        const pegRatio = parseFloat(data['PEGRatio']) || undefined;
        const marketCap = parseFloat(data['MarketCapitalization']) || undefined;
        const dividendYield = parseFloat(data['DividendYield']) * 100 || undefined;
        const profitMargin = parseFloat(data['ProfitMargin']) * 100 || undefined;
        const operatingMargin = parseFloat(data['OperatingMarginTTM']) * 100 || undefined;
        const roe = parseFloat(data['ReturnOnEquityTTM']) * 100 || undefined;
        const revenueGrowth = parseFloat(data['QuarterlyRevenueGrowthYOY']) * 100 || undefined;
        const earningsGrowth = parseFloat(data['QuarterlyEarningsGrowthYOY']) * 100 || undefined;
        const beta = parseFloat(data['Beta']) || undefined;
        const sector = data['Sector'];
        const industry = data['Industry'];
        const name = data['Name'];

        // Check filters
        if (filters.pe_ratio) {
          if (!peRatio) continue;
          if (filters.pe_ratio.min !== undefined && peRatio < filters.pe_ratio.min) continue;
          if (filters.pe_ratio.max !== undefined && peRatio > filters.pe_ratio.max) continue;
        }

        if (filters.pb_ratio) {
          if (!pbRatio) continue;
          if (filters.pb_ratio.min !== undefined && pbRatio < filters.pb_ratio.min) continue;
          if (filters.pb_ratio.max !== undefined && pbRatio > filters.pb_ratio.max) continue;
        }

        if (filters.peg_ratio) {
          if (!pegRatio) continue;
          if (filters.peg_ratio.min !== undefined && pegRatio < filters.peg_ratio.min) continue;
          if (filters.peg_ratio.max !== undefined && pegRatio > filters.peg_ratio.max) continue;
        }

        if (filters.market_cap) {
          if (!marketCap) continue;
          if (filters.market_cap.min !== undefined && marketCap < filters.market_cap.min) continue;
          if (filters.market_cap.max !== undefined && marketCap > filters.market_cap.max) continue;
        }

        if (filters.dividend_yield) {
          if (dividendYield === undefined) continue;
          if (filters.dividend_yield.min !== undefined && dividendYield < filters.dividend_yield.min) continue;
          if (filters.dividend_yield.max !== undefined && dividendYield > filters.dividend_yield.max) continue;
        }

        if (filters.profit_margin) {
          if (!profitMargin) continue;
          if (filters.profit_margin.min !== undefined && profitMargin < filters.profit_margin.min) continue;
          if (filters.profit_margin.max !== undefined && profitMargin > filters.profit_margin.max) continue;
        }

        if (filters.operating_margin) {
          if (!operatingMargin) continue;
          if (filters.operating_margin.min !== undefined && operatingMargin < filters.operating_margin.min) continue;
          if (filters.operating_margin.max !== undefined && operatingMargin > filters.operating_margin.max) continue;
        }

        if (filters.roe) {
          if (!roe) continue;
          if (filters.roe.min !== undefined && roe < filters.roe.min) continue;
          if (filters.roe.max !== undefined && roe > filters.roe.max) continue;
        }

        if (filters.revenue_growth) {
          if (revenueGrowth === undefined) continue;
          if (filters.revenue_growth.min !== undefined && revenueGrowth < filters.revenue_growth.min) continue;
          if (filters.revenue_growth.max !== undefined && revenueGrowth > filters.revenue_growth.max) continue;
        }

        if (filters.earnings_growth) {
          if (earningsGrowth === undefined) continue;
          if (filters.earnings_growth.min !== undefined && earningsGrowth < filters.earnings_growth.min) continue;
          if (filters.earnings_growth.max !== undefined && earningsGrowth > filters.earnings_growth.max) continue;
        }

        if (filters.beta) {
          if (!beta) continue;
          if (filters.beta.min !== undefined && beta < filters.beta.min) continue;
          if (filters.beta.max !== undefined && beta > filters.beta.max) continue;
        }

        if (filters.sector && sector !== filters.sector) continue;

        // Stock passed all filters
        results.push({
          symbol,
          name,
          sector,
          industry,
          marketCap,
          peRatio,
          pbRatio,
          dividendYield,
          profitMargin,
          roe,
          beta,
        });

        // Stop if we have enough results
        if (results.length >= limit) break;
      }

      // Stop processing batches if we have enough results
      if (results.length >= limit) break;

      // Add delay between batches to respect rate limits
      if (batches.indexOf(batch) < batches.length - 1 && results.length < limit) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return {
      results: results.slice(0, limit),
      total: results.length,
      filters_applied: filtersApplied,
    };
  }

  /**
   * Get available sectors
   */
  getAvailableSectors(): string[] {
    return [
      'Technology',
      'Healthcare',
      'Financial Services',
      'Consumer Cyclical',
      'Communication Services',
      'Industrials',
      'Consumer Defensive',
      'Energy',
      'Real Estate',
      'Utilities',
      'Basic Materials',
    ];
  }

  /**
   * Get preset screeners
   */
  getPresetScreeners(): Record<string, ScreenerFilters> {
    return {
      value_stocks: {
        pe_ratio: { max: 15 },
        pb_ratio: { max: 2 },
        dividend_yield: { min: 2 },
      },
      growth_stocks: {
        revenue_growth: { min: 15 },
        earnings_growth: { min: 15 },
        roe: { min: 15 },
      },
      dividend_aristocrats: {
        dividend_yield: { min: 2.5 },
        profit_margin: { min: 10 },
        market_cap: { min: 10000000000 },
      },
      large_cap_tech: {
        sector: 'Technology',
        market_cap: { min: 100000000000 },
      },
      undervalued: {
        pe_ratio: { max: 20 },
        peg_ratio: { max: 1.5 },
        profit_margin: { min: 5 },
      },
      high_momentum: {
        earnings_growth: { min: 20 },
        revenue_growth: { min: 10 },
      },
      low_volatility: {
        beta: { max: 1 },
        dividend_yield: { min: 1 },
      },
      small_cap_value: {
        market_cap: { min: 300000000, max: 2000000000 },
        pe_ratio: { max: 15 },
      },
    };
  }
}

export const screenerService = new ScreenerService();
