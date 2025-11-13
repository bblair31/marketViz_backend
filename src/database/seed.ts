import { prisma } from './client';
import { hashPassword } from '../utils/bcrypt';
import { logger } from '../utils/logger';

async function seed() {
  try {
    logger.info('🌱 Starting database seed...');

    // Clear existing data
    await prisma.search.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.stock.deleteMany();
    await prisma.user.deleteMany();

    logger.info('Cleared existing data');

    // Create multiple users with different profiles
    const users = await Promise.all([
      prisma.user.create({
        data: {
          username: 'demouser',
          email: 'demo@marketviz.com',
          passwordHash: await hashPassword('password123'),
        },
      }),
      prisma.user.create({
        data: {
          username: 'investor_jane',
          email: 'jane@example.com',
          passwordHash: await hashPassword('password123'),
        },
      }),
      prisma.user.create({
        data: {
          username: 'trader_mike',
          email: 'mike@example.com',
          passwordHash: await hashPassword('password123'),
        },
      }),
    ]);

    logger.info(`Created ${users.length} users`);

    // Create diverse stock portfolio
    const stockData = [
      // Tech Giants
      { symbol: 'AAPL', companyName: 'Apple Inc.' },
      { symbol: 'GOOGL', companyName: 'Alphabet Inc.' },
      { symbol: 'MSFT', companyName: 'Microsoft Corporation' },
      { symbol: 'AMZN', companyName: 'Amazon.com, Inc.' },
      { symbol: 'META', companyName: 'Meta Platforms, Inc.' },
      { symbol: 'NVDA', companyName: 'NVIDIA Corporation' },

      // Growth Stocks
      { symbol: 'TSLA', companyName: 'Tesla, Inc.' },
      { symbol: 'NFLX', companyName: 'Netflix, Inc.' },
      { symbol: 'SHOP', companyName: 'Shopify Inc.' },

      // Blue Chips
      { symbol: 'JNJ', companyName: 'Johnson & Johnson' },
      { symbol: 'JPM', companyName: 'JPMorgan Chase & Co.' },
      { symbol: 'V', companyName: 'Visa Inc.' },
      { symbol: 'WMT', companyName: 'Walmart Inc.' },

      // ETFs
      { symbol: 'SPY', companyName: 'SPDR S&P 500 ETF Trust' },
      { symbol: 'QQQ', companyName: 'Invesco QQQ Trust' },
    ];

    const stocks = await Promise.all(
      stockData.map((data) => prisma.stock.create({ data }))
    );

    logger.info(`Created ${stocks.length} stocks`);

    // Create realistic portfolios for each user

    // Demo user: Conservative tech portfolio
    await Promise.all([
      prisma.transaction.create({
        data: { userId: users[0].id, stockId: stocks[0].id, priceBought: 150.25 },
      }),
      prisma.transaction.create({
        data: { userId: users[0].id, stockId: stocks[2].id, priceBought: 320.50 },
      }),
      prisma.transaction.create({
        data: { userId: users[0].id, stockId: stocks[3].id, priceBought: 135.75 },
      }),
      prisma.transaction.create({
        data: { userId: users[0].id, stockId: stocks[13].id, priceBought: 425.30 },
      }),
    ]);

    // Jane: Diversified growth investor
    await Promise.all([
      prisma.transaction.create({
        data: { userId: users[1].id, stockId: stocks[5].id, priceBought: 450.00 },
      }),
      prisma.transaction.create({
        data: { userId: users[1].id, stockId: stocks[6].id, priceBought: 225.80 },
      }),
      prisma.transaction.create({
        data: { userId: users[1].id, stockId: stocks[7].id, priceBought: 385.60 },
      }),
      prisma.transaction.create({
        data: { userId: users[1].id, stockId: stocks[11].id, priceBought: 240.15 },
      }),
      prisma.transaction.create({
        data: { userId: users[1].id, stockId: stocks[14].id, priceBought: 380.75 },
      }),
    ]);

    // Mike: Active trader with more positions
    await Promise.all([
      prisma.transaction.create({
        data: { userId: users[2].id, stockId: stocks[1].id, priceBought: 142.30 },
      }),
      prisma.transaction.create({
        data: { userId: users[2].id, stockId: stocks[4].id, priceBought: 310.20 },
      }),
      prisma.transaction.create({
        data: { userId: users[2].id, stockId: stocks[8].id, priceBought: 65.40 },
      }),
      prisma.transaction.create({
        data: { userId: users[2].id, stockId: stocks[10].id, priceBought: 155.90 },
      }),
    ]);

    logger.info('Created realistic portfolios for all users');

    // Create realistic search history
    const searchData = [
      // Demo user searches
      { userId: users[0].id, searchTerm: 'AAPL' },
      { userId: users[0].id, searchTerm: 'dividend stocks' },
      { userId: users[0].id, searchTerm: 'SPY' },
      { userId: users[0].id, searchTerm: 'tech stocks' },

      // Jane's searches
      { userId: users[1].id, searchTerm: 'NVDA' },
      { userId: users[1].id, searchTerm: 'growth stocks 2025' },
      { userId: users[1].id, searchTerm: 'TSLA' },
      { userId: users[1].id, searchTerm: 'AI companies' },

      // Mike's searches
      { userId: users[2].id, searchTerm: 'META' },
      { userId: users[2].id, searchTerm: 'day trading' },
      { userId: users[2].id, searchTerm: 'volatility' },
      { userId: users[2].id, searchTerm: 'options' },
    ];

    await prisma.search.createMany({ data: searchData });

    logger.info(`Created ${searchData.length} search records`);

    logger.info('✅ Database seeding completed successfully!');
    logger.info('\n📊 Demo Accounts:');
    logger.info('  1. Conservative Investor');
    logger.info('     Email: demo@marketviz.com');
    logger.info('     Password: password123');
    logger.info('     Portfolio: Tech blue chips + S&P 500 ETF\n');
    logger.info('  2. Growth Investor');
    logger.info('     Email: jane@example.com');
    logger.info('     Password: password123');
    logger.info('     Portfolio: High-growth tech stocks\n');
    logger.info('  3. Active Trader');
    logger.info('     Email: mike@example.com');
    logger.info('     Password: password123');
    logger.info('     Portfolio: Diversified with frequent trading\n');
  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
