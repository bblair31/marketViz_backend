import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { alphaVantageService } from './alphaVantage.service';
import { logger } from '../utils/logger';
import { NotFoundError, BadRequestError } from '../utils/errors';

// Define types manually until Prisma client is regenerated
export type AlertCondition = 'ABOVE' | 'BELOW' | 'CROSSES_ABOVE' | 'CROSSES_BELOW';
export type AlertStatus = 'ACTIVE' | 'TRIGGERED' | 'CANCELLED';

interface QuoteData {
  'Global Quote'?: {
    '01. symbol'?: string;
    '05. price'?: string;
    [key: string]: string | undefined;
  };
}

const prisma = new PrismaClient();

interface CreateAlertInput {
  userId: number;
  symbol: string;
  condition: AlertCondition;
  targetPrice: number;
  note?: string;
}

interface UpdateAlertInput {
  condition?: AlertCondition;
  targetPrice?: number;
  note?: string;
}

interface AlertWithTriggeredInfo {
  id: number;
  userId: number;
  symbol: string;
  condition: AlertCondition;
  targetPrice: Decimal;
  status: AlertStatus;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  triggeredAt: Date | null;
  currentPrice?: number;
  triggered?: boolean;
}

class AlertsService {
  /**
   * Create a new price alert
   */
  async createAlert(input: CreateAlertInput) {
    const { userId, symbol, condition, targetPrice, note } = input;

    // Validate the symbol exists by fetching a quote
    try {
      await alphaVantageService.getQuote(symbol.toUpperCase());
    } catch (error) {
      throw new BadRequestError(`Invalid symbol: ${symbol}`);
    }

    const alert = await prisma.priceAlert.create({
      data: {
        userId,
        symbol: symbol.toUpperCase(),
        condition,
        targetPrice,
        note,
      },
    });

    logger.info(`Created price alert ${alert.id} for user ${userId}: ${symbol} ${condition} ${targetPrice}`);
    return alert;
  }

  /**
   * Get all alerts for a user
   */
  async getUserAlerts(userId: number, status?: AlertStatus) {
    const where: { userId: number; status?: AlertStatus } = { userId };
    if (status) {
      where.status = status;
    }

    const alerts = await prisma.priceAlert.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return alerts;
  }

  /**
   * Get a specific alert
   */
  async getAlert(alertId: number, userId: number) {
    const alert = await prisma.priceAlert.findFirst({
      where: {
        id: alertId,
        userId,
      },
    });

    if (!alert) {
      throw new NotFoundError('Alert not found');
    }

    return alert;
  }

  /**
   * Update an alert
   */
  async updateAlert(alertId: number, userId: number, input: UpdateAlertInput) {
    // First verify the alert exists and belongs to the user
    const existing = await this.getAlert(alertId, userId);

    if (existing.status !== 'ACTIVE') {
      throw new BadRequestError('Cannot update a non-active alert');
    }

    const alert = await prisma.priceAlert.update({
      where: { id: alertId },
      data: {
        ...(input.condition && { condition: input.condition }),
        ...(input.targetPrice && { targetPrice: input.targetPrice }),
        ...(input.note !== undefined && { note: input.note }),
      },
    });

    logger.info(`Updated price alert ${alertId} for user ${userId}`);
    return alert;
  }

  /**
   * Cancel an alert
   */
  async cancelAlert(alertId: number, userId: number) {
    // First verify the alert exists and belongs to the user
    const existing = await this.getAlert(alertId, userId);

    if (existing.status !== 'ACTIVE') {
      throw new BadRequestError('Alert is not active');
    }

    const alert = await prisma.priceAlert.update({
      where: { id: alertId },
      data: {
        status: 'CANCELLED',
      },
    });

    logger.info(`Cancelled price alert ${alertId} for user ${userId}`);
    return alert;
  }

  /**
   * Delete an alert
   */
  async deleteAlert(alertId: number, userId: number) {
    // First verify the alert exists and belongs to the user
    await this.getAlert(alertId, userId);

    await prisma.priceAlert.delete({
      where: { id: alertId },
    });

    logger.info(`Deleted price alert ${alertId} for user ${userId}`);
  }

  /**
   * Check alerts for a specific symbol and return triggered alerts
   * This can be called when fetching a quote to check if any alerts should fire
   */
  async checkAlertsForSymbol(symbol: string, currentPrice: number): Promise<AlertWithTriggeredInfo[]> {
    const activeAlerts = await prisma.priceAlert.findMany({
      where: {
        symbol: symbol.toUpperCase(),
        status: 'ACTIVE',
      },
    });

    const triggeredAlerts: AlertWithTriggeredInfo[] = [];

    for (const alert of activeAlerts) {
      const targetPrice = Number(alert.targetPrice);
      let triggered = false;

      switch (alert.condition) {
        case 'ABOVE':
          triggered = currentPrice >= targetPrice;
          break;
        case 'BELOW':
          triggered = currentPrice <= targetPrice;
          break;
        case 'CROSSES_ABOVE':
          // For crosses, we'd need previous price - simplified to same as ABOVE
          triggered = currentPrice >= targetPrice;
          break;
        case 'CROSSES_BELOW':
          // For crosses, we'd need previous price - simplified to same as BELOW
          triggered = currentPrice <= targetPrice;
          break;
      }

      if (triggered) {
        // Update the alert status
        await prisma.priceAlert.update({
          where: { id: alert.id },
          data: {
            status: 'TRIGGERED',
            triggeredAt: new Date(),
          },
        });

        triggeredAlerts.push({
          ...alert,
          currentPrice,
          triggered: true,
        });

        logger.info(
          `Alert ${alert.id} triggered: ${symbol} ${alert.condition} ${targetPrice}, current: ${currentPrice}`
        );
      }
    }

    return triggeredAlerts;
  }

  /**
   * Check all active alerts for a user
   * Returns alerts with their current trigger status
   */
  async checkUserAlerts(userId: number): Promise<AlertWithTriggeredInfo[]> {
    const activeAlerts = await prisma.priceAlert.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });

    // Group alerts by symbol to minimize API calls
    const symbolGroups = new Map<string, typeof activeAlerts>();
    for (const alert of activeAlerts) {
      const existing = symbolGroups.get(alert.symbol) || [];
      existing.push(alert);
      symbolGroups.set(alert.symbol, existing);
    }

    const results: AlertWithTriggeredInfo[] = [];

    // Check each symbol
    for (const [symbol, alerts] of symbolGroups) {
      try {
        const quoteData = (await alphaVantageService.getQuote(symbol)) as QuoteData;
        const quote = quoteData['Global Quote'];

        if (!quote || !quote['05. price']) {
          // Skip if no price data
          for (const alert of alerts) {
            results.push({
              ...alert,
              triggered: false,
            });
          }
          continue;
        }

        const currentPrice = parseFloat(quote['05. price']);

        for (const alert of alerts) {
          const targetPrice = Number(alert.targetPrice);
          let triggered = false;

          switch (alert.condition) {
            case 'ABOVE':
              triggered = currentPrice >= targetPrice;
              break;
            case 'BELOW':
              triggered = currentPrice <= targetPrice;
              break;
            case 'CROSSES_ABOVE':
              triggered = currentPrice >= targetPrice;
              break;
            case 'CROSSES_BELOW':
              triggered = currentPrice <= targetPrice;
              break;
          }

          if (triggered) {
            // Update the alert status
            await prisma.priceAlert.update({
              where: { id: alert.id },
              data: {
                status: 'TRIGGERED',
                triggeredAt: new Date(),
              },
            });
          }

          results.push({
            ...alert,
            currentPrice,
            triggered,
            status: triggered ? 'TRIGGERED' : alert.status,
            triggeredAt: triggered ? new Date() : alert.triggeredAt,
          });
        }
      } catch (error) {
        // If we can't get the quote, include alerts without price info
        logger.error(`Failed to get quote for ${symbol}: ${error}`);
        for (const alert of alerts) {
          results.push({
            ...alert,
            triggered: false,
          });
        }
      }
    }

    return results;
  }

  /**
   * Get alert statistics for a user
   */
  async getAlertStats(userId: number) {
    const [active, triggered, cancelled, total] = await Promise.all([
      prisma.priceAlert.count({ where: { userId, status: 'ACTIVE' } }),
      prisma.priceAlert.count({ where: { userId, status: 'TRIGGERED' } }),
      prisma.priceAlert.count({ where: { userId, status: 'CANCELLED' } }),
      prisma.priceAlert.count({ where: { userId } }),
    ]);

    return {
      active,
      triggered,
      cancelled,
      total,
    };
  }
}

export const alertsService = new AlertsService();
