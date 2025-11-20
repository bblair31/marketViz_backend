import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { alphaVantageService } from './alphaVantage.service';

interface JwtPayload {
  userId: number;
  email: string;
}

interface SubscriptionData {
  symbols: string[];
  userId?: number;
}

class WebSocketService {
  private io: Server | null = null;
  private priceIntervals: Map<string, NodeJS.Timeout> = new Map();
  private symbolSubscribers: Map<string, Set<string>> = new Map(); // symbol -> socket ids

  /**
   * Initialize Socket.IO server
   */
  initialize(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: config.cors.origin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (token) {
          const decoded = jwt.verify(token as string, config.jwt.secret) as JwtPayload;
          socket.data.userId = decoded.userId;
          socket.data.authenticated = true;
        } else {
          socket.data.authenticated = false;
        }

        next();
      } catch (error) {
        // Allow unauthenticated connections for public data
        socket.data.authenticated = false;
        next();
      }
    });

    this.io.on('connection', (socket) => this.handleConnection(socket));

    logger.info('✅ WebSocket server initialized');
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: Socket): void {
    logger.info(`WebSocket connected: ${socket.id} (authenticated: ${socket.data.authenticated})`);

    // Join user-specific room if authenticated
    if (socket.data.authenticated && socket.data.userId) {
      socket.join(`user:${socket.data.userId}`);
      logger.debug(`Socket ${socket.id} joined room user:${socket.data.userId}`);
    }

    // Handle subscription to price updates
    socket.on('subscribe:prices', (data: SubscriptionData) => {
      this.handlePriceSubscription(socket, data);
    });

    // Handle unsubscription from price updates
    socket.on('unsubscribe:prices', (data: { symbols: string[] }) => {
      this.handlePriceUnsubscription(socket, data.symbols);
    });

    // Handle subscription to portfolio updates (requires auth)
    socket.on('subscribe:portfolio', () => {
      if (!socket.data.authenticated) {
        socket.emit('error', { message: 'Authentication required for portfolio updates' });
        return;
      }
      socket.join(`portfolio:${socket.data.userId}`);
      logger.debug(`Socket ${socket.id} subscribed to portfolio updates`);
    });

    // Handle subscription to alerts (requires auth)
    socket.on('subscribe:alerts', () => {
      if (!socket.data.authenticated) {
        socket.emit('error', { message: 'Authentication required for alert notifications' });
        return;
      }
      socket.join(`alerts:${socket.data.userId}`);
      logger.debug(`Socket ${socket.id} subscribed to alert notifications`);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`WebSocket disconnected: ${socket.id} (${reason})`);
      this.cleanupSocketSubscriptions(socket.id);
    });

    // Send initial connection success
    socket.emit('connected', {
      socketId: socket.id,
      authenticated: socket.data.authenticated,
      userId: socket.data.userId,
    });
  }

  /**
   * Handle price subscription
   */
  private handlePriceSubscription(socket: Socket, data: SubscriptionData): void {
    const { symbols } = data;

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      socket.emit('error', { message: 'Invalid symbols array' });
      return;
    }

    // Limit symbols per connection
    if (symbols.length > 20) {
      socket.emit('error', { message: 'Maximum 20 symbols per subscription' });
      return;
    }

    const normalizedSymbols = symbols.map(s => s.toUpperCase());

    for (const symbol of normalizedSymbols) {
      // Join symbol room
      socket.join(`price:${symbol}`);

      // Track subscriber
      if (!this.symbolSubscribers.has(symbol)) {
        this.symbolSubscribers.set(symbol, new Set());
      }
      this.symbolSubscribers.get(symbol)!.add(socket.id);

      // Start price polling if not already active
      if (!this.priceIntervals.has(symbol)) {
        this.startPricePolling(symbol);
      }
    }

    socket.emit('subscribed:prices', { symbols: normalizedSymbols });
    logger.debug(`Socket ${socket.id} subscribed to prices: ${normalizedSymbols.join(', ')}`);
  }

  /**
   * Handle price unsubscription
   */
  private handlePriceUnsubscription(socket: Socket, symbols: string[]): void {
    if (!symbols || !Array.isArray(symbols)) return;

    const normalizedSymbols = symbols.map(s => s.toUpperCase());

    for (const symbol of normalizedSymbols) {
      socket.leave(`price:${symbol}`);

      const subscribers = this.symbolSubscribers.get(symbol);
      if (subscribers) {
        subscribers.delete(socket.id);

        // Stop polling if no more subscribers
        if (subscribers.size === 0) {
          this.stopPricePolling(symbol);
          this.symbolSubscribers.delete(symbol);
        }
      }
    }

    socket.emit('unsubscribed:prices', { symbols: normalizedSymbols });
  }

  /**
   * Start polling prices for a symbol
   */
  private startPricePolling(symbol: string): void {
    // Poll every 30 seconds (respecting API rate limits)
    const interval = setInterval(async () => {
      try {
        const quoteData = await alphaVantageService.getQuote(symbol);
        const quote = (quoteData as { 'Global Quote'?: Record<string, string> })['Global Quote'];

        if (quote) {
          const priceUpdate = {
            symbol,
            price: parseFloat(quote['05. price'] || '0'),
            change: parseFloat(quote['09. change'] || '0'),
            changePercent: parseFloat((quote['10. change percent'] || '0%').replace('%', '')),
            volume: parseInt(quote['06. volume'] || '0', 10),
            timestamp: new Date().toISOString(),
          };

          this.io?.to(`price:${symbol}`).emit('price:update', priceUpdate);
        }
      } catch (error) {
        logger.error(`Failed to fetch price for ${symbol}: ${error}`);
      }
    }, 30000); // 30 seconds

    this.priceIntervals.set(symbol, interval);
    logger.debug(`Started price polling for ${symbol}`);

    // Send initial price immediately
    this.sendInitialPrice(symbol);
  }

  /**
   * Send initial price when subscribing
   */
  private async sendInitialPrice(symbol: string): Promise<void> {
    try {
      const quoteData = await alphaVantageService.getQuote(symbol);
      const quote = (quoteData as { 'Global Quote'?: Record<string, string> })['Global Quote'];

      if (quote) {
        const priceUpdate = {
          symbol,
          price: parseFloat(quote['05. price'] || '0'),
          change: parseFloat(quote['09. change'] || '0'),
          changePercent: parseFloat((quote['10. change percent'] || '0%').replace('%', '')),
          volume: parseInt(quote['06. volume'] || '0', 10),
          high: parseFloat(quote['03. high'] || '0'),
          low: parseFloat(quote['04. low'] || '0'),
          open: parseFloat(quote['02. open'] || '0'),
          previousClose: parseFloat(quote['08. previous close'] || '0'),
          timestamp: new Date().toISOString(),
        };

        this.io?.to(`price:${symbol}`).emit('price:update', priceUpdate);
      }
    } catch (error) {
      logger.error(`Failed to fetch initial price for ${symbol}: ${error}`);
    }
  }

  /**
   * Stop polling prices for a symbol
   */
  private stopPricePolling(symbol: string): void {
    const interval = this.priceIntervals.get(symbol);
    if (interval) {
      clearInterval(interval);
      this.priceIntervals.delete(symbol);
      logger.debug(`Stopped price polling for ${symbol}`);
    }
  }

  /**
   * Clean up subscriptions when socket disconnects
   */
  private cleanupSocketSubscriptions(socketId: string): void {
    for (const [symbol, subscribers] of this.symbolSubscribers) {
      subscribers.delete(socketId);

      if (subscribers.size === 0) {
        this.stopPricePolling(symbol);
        this.symbolSubscribers.delete(symbol);
      }
    }
  }

  /**
   * Emit alert triggered notification to user
   */
  emitAlertTriggered(userId: number, alert: {
    id: number;
    symbol: string;
    condition: string;
    targetPrice: number;
    currentPrice: number;
  }): void {
    if (!this.io) return;

    this.io.to(`alerts:${userId}`).emit('alert:triggered', {
      ...alert,
      triggeredAt: new Date().toISOString(),
    });

    // Also emit to user room for general notifications
    this.io.to(`user:${userId}`).emit('notification', {
      type: 'alert_triggered',
      title: 'Price Alert Triggered',
      message: `${alert.symbol} is now ${alert.condition.toLowerCase()} $${alert.targetPrice}`,
      data: alert,
    });

    logger.info(`Alert notification sent to user ${userId}: ${alert.symbol} ${alert.condition} ${alert.targetPrice}`);
  }

  /**
   * Emit portfolio update to user
   */
  emitPortfolioUpdate(userId: number, data: {
    totalValue: number;
    totalGain: number;
    totalGainPercent: number;
    dayChange: number;
    dayChangePercent: number;
  }): void {
    if (!this.io) return;

    this.io.to(`portfolio:${userId}`).emit('portfolio:update', {
      ...data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Broadcast market news to all connected clients
   */
  broadcastNews(news: {
    title: string;
    summary: string;
    source: string;
    url: string;
    symbols?: string[];
  }): void {
    if (!this.io) return;

    this.io.emit('news:breaking', {
      ...news,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    authenticatedConnections: number;
    activeSymbols: number;
    symbolSubscriptions: Record<string, number>;
  } {
    if (!this.io) {
      return {
        totalConnections: 0,
        authenticatedConnections: 0,
        activeSymbols: 0,
        symbolSubscriptions: {},
      };
    }

    const sockets = this.io.sockets.sockets;
    let authenticated = 0;

    sockets.forEach((socket) => {
      if (socket.data.authenticated) {
        authenticated++;
      }
    });

    const symbolSubscriptions: Record<string, number> = {};
    this.symbolSubscribers.forEach((subscribers, symbol) => {
      symbolSubscriptions[symbol] = subscribers.size;
    });

    return {
      totalConnections: sockets.size,
      authenticatedConnections: authenticated,
      activeSymbols: this.symbolSubscribers.size,
      symbolSubscriptions,
    };
  }

  /**
   * Get the Socket.IO server instance
   */
  getIO(): Server | null {
    return this.io;
  }
}

export const websocketService = new WebSocketService();
