import { watchlistService } from '../../services/watchlist.service';
import { prisma } from '../../database/client';
import { alphaVantageService } from '../../services/alphaVantage.service';
import { BadRequestError, NotFoundError } from '../../utils/errors';

jest.mock('../../database/client', () => ({
  prisma: {
    transaction: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    stock: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../../services/alphaVantage.service');

describe('Watchlist Service', () => {
  const mockUserId = 1;
  const mockStock = {
    id: 1,
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    iexId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransaction = {
    id: 1,
    userId: mockUserId,
    stockId: mockStock.id,
    priceBought: 150.5,
    createdAt: new Date(),
    updatedAt: new Date(),
    stock: mockStock,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getWatchlist', () => {
    it('should return watchlist with current quotes', async () => {
      const mockQuote = {
        'Global Quote': {
          '01. symbol': 'AAPL',
          '05. price': '182.50',
        },
      };

      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([mockTransaction]);
      (alphaVantageService.getQuote as jest.Mock).mockResolvedValue(mockQuote);

      const result = await watchlistService.getWatchlist(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject(mockTransaction);
      expect(result[0].currentQuote).toEqual(mockQuote);
    });

    it('should handle quote fetch failures gracefully', async () => {
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([mockTransaction]);
      (alphaVantageService.getQuote as jest.Mock).mockRejectedValue(new Error('API Error'));

      const result = await watchlistService.getWatchlist(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].currentQuote).toBeNull();
    });
  });

  describe('addToWatchlist', () => {
    const mockInput = {
      symbol: 'AAPL',
      companyName: 'Apple Inc.',
      priceBought: 150.5,
    };

    it('should add new stock to watchlist', async () => {
      (prisma.stock.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.stock.create as jest.Mock).mockResolvedValue(mockStock);
      (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.transaction.create as jest.Mock).mockResolvedValue(mockTransaction);

      const result = await watchlistService.addToWatchlist(mockUserId, mockInput);

      expect(result).toMatchObject(mockTransaction);
      expect(prisma.stock.create).toHaveBeenCalled();
      expect(prisma.transaction.create).toHaveBeenCalled();
    });

    it('should use existing stock if already in database', async () => {
      (prisma.stock.findUnique as jest.Mock).mockResolvedValue(mockStock);
      (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.transaction.create as jest.Mock).mockResolvedValue(mockTransaction);

      const result = await watchlistService.addToWatchlist(mockUserId, mockInput);

      expect(result).toMatchObject(mockTransaction);
      expect(prisma.stock.create).not.toHaveBeenCalled();
      expect(prisma.transaction.create).toHaveBeenCalled();
    });

    it('should throw BadRequestError if stock already in watchlist', async () => {
      (prisma.stock.findUnique as jest.Mock).mockResolvedValue(mockStock);
      (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(mockTransaction);

      await expect(
        watchlistService.addToWatchlist(mockUserId, mockInput)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('removeFromWatchlist', () => {
    it('should remove stock from watchlist', async () => {
      (prisma.stock.findUnique as jest.Mock).mockResolvedValue(mockStock);
      (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(mockTransaction);
      (prisma.transaction.delete as jest.Mock).mockResolvedValue(mockTransaction);

      await watchlistService.removeFromWatchlist(mockUserId, 'AAPL');

      expect(prisma.transaction.delete).toHaveBeenCalledWith({
        where: { id: mockTransaction.id },
      });
    });

    it('should throw NotFoundError if stock not in database', async () => {
      (prisma.stock.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        watchlistService.removeFromWatchlist(mockUserId, 'INVALID')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw NotFoundError if stock not in watchlist', async () => {
      (prisma.stock.findUnique as jest.Mock).mockResolvedValue(mockStock);
      (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        watchlistService.removeFromWatchlist(mockUserId, 'AAPL')
      ).rejects.toThrow(NotFoundError);
    });
  });
});
