import { prisma } from '../database/client';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { alphaVantageService } from './alphaVantage.service';
import { logger } from '../utils/logger';

export interface AddToWatchlistDTO {
  symbol: string;
  companyName: string;
  priceBought?: number;
}

class WatchlistService {
  /**
   * Get user's watchlist with current stock prices
   */
  async getWatchlist(userId: number) {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        stock: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get current quotes for all stocks in parallel
    const stocksWithQuotes = await Promise.all(
      transactions.map(async (transaction: any) => {
        try {
          const quote = await alphaVantageService.getQuote(transaction.stock.symbol);
          return {
            ...transaction,
            currentQuote: quote,
          };
        } catch (error) {
          logger.warn(`Failed to fetch quote for ${transaction.stock.symbol}`);
          return {
            ...transaction,
            currentQuote: null,
          };
        }
      })
    );

    return stocksWithQuotes;
  }

  /**
   * Add stock to watchlist
   */
  async addToWatchlist(userId: number, data: AddToWatchlistDTO) {
    const { symbol, companyName, priceBought } = data;

    if (!symbol || !companyName) {
      throw new BadRequestError('Symbol and company name are required');
    }

    // Find or create stock
    let stock = await prisma.stock.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!stock) {
      stock = await prisma.stock.create({
        data: {
          symbol: symbol.toUpperCase(),
          companyName,
        },
      });
    }

    // Check if already in watchlist
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        userId,
        stockId: stock.id,
      },
    });

    if (existingTransaction) {
      throw new BadRequestError('Stock already in watchlist');
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        stockId: stock.id,
        priceBought: priceBought || null,
      },
      include: {
        stock: true,
      },
    });

    logger.info(`User ${userId} added ${symbol} to watchlist`);

    return transaction;
  }

  /**
   * Remove stock from watchlist
   */
  async removeFromWatchlist(userId: number, symbol: string) {
    const stock = await prisma.stock.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!stock) {
      throw new NotFoundError('Stock not found');
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        userId,
        stockId: stock.id,
      },
    });

    if (!transaction) {
      throw new NotFoundError('Stock not in watchlist');
    }

    await prisma.transaction.delete({
      where: { id: transaction.id },
    });

    logger.info(`User ${userId} removed ${symbol} from watchlist`);

    return { message: 'Stock removed from watchlist' };
  }

  /**
   * Get news for watchlist stocks
   */
  async getWatchlistNews(userId: number) {
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        stock: true,
      },
    });

    if (transactions.length === 0) {
      return { feed: [] };
    }

    const symbols = transactions.map((t: any) => t.stock.symbol).join(',');

    try {
      const news = await alphaVantageService.getNewsSentiment(symbols, 50);
      return news;
    } catch (error) {
      logger.error('Failed to fetch watchlist news', error);
      return { feed: [] };
    }
  }

  /**
   * Record a search
   */
  async recordSearch(userId: number, searchTerm: string) {
    await prisma.search.create({
      data: {
        userId,
        searchTerm,
      },
    });
  }

  /**
   * Get user's search history
   */
  async getSearchHistory(userId: number, limit: number = 10) {
    return prisma.search.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }
}

export const watchlistService = new WatchlistService();
