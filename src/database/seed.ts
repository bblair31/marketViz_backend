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

    // Create demo user
    const demoUser = await prisma.user.create({
      data: {
        username: 'demouser',
        email: 'demo@marketviz.com',
        passwordHash: await hashPassword('password123'),
      },
    });

    logger.info(`Created demo user: ${demoUser.email}`);

    // Create sample stocks
    const stocks = await Promise.all([
      prisma.stock.create({
        data: {
          symbol: 'AAPL',
          companyName: 'Apple Inc.',
        },
      }),
      prisma.stock.create({
        data: {
          symbol: 'GOOGL',
          companyName: 'Alphabet Inc.',
        },
      }),
      prisma.stock.create({
        data: {
          symbol: 'MSFT',
          companyName: 'Microsoft Corporation',
        },
      }),
      prisma.stock.create({
        data: {
          symbol: 'TSLA',
          companyName: 'Tesla, Inc.',
        },
      }),
      prisma.stock.create({
        data: {
          symbol: 'AMZN',
          companyName: 'Amazon.com, Inc.',
        },
      }),
    ]);

    logger.info(`Created ${stocks.length} stocks`);

    // Create sample transactions (watchlist)
    const transactions = await Promise.all(
      stocks.slice(0, 3).map((stock, index) =>
        prisma.transaction.create({
          data: {
            userId: demoUser.id,
            stockId: stock.id,
            priceBought: 100 + index * 50,
          },
        })
      )
    );

    logger.info(`Created ${transactions.length} transactions`);

    // Create sample searches
    await prisma.search.createMany({
      data: [
        { userId: demoUser.id, searchTerm: 'AAPL' },
        { userId: demoUser.id, searchTerm: 'TSLA' },
        { userId: demoUser.id, searchTerm: 'tech stocks' },
      ],
    });

    logger.info('Created sample searches');

    logger.info('✅ Database seeding completed successfully!');
    logger.info('\nDemo Account:');
    logger.info('  Email: demo@marketviz.com');
    logger.info('  Password: password123');
  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
