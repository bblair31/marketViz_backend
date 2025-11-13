import NodeCache from 'node-cache';
import { logger } from '../utils/logger';

class CacheService {
  private cache: NodeCache;

  constructor() {
    // Cache with 5 minute TTL by default
    this.cache = new NodeCache({
      stdTTL: 300,
      checkperiod: 60,
      useClones: false,
    });

    this.cache.on('set', (key) => {
      logger.debug(`Cache SET: ${key}`);
    });

    this.cache.on('expired', (key) => {
      logger.debug(`Cache EXPIRED: ${key}`);
    });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set(key, value, ttl || 0);
  }

  del(key: string): number {
    return this.cache.del(key);
  }

  flush(): void {
    this.cache.flushAll();
    logger.info('Cache flushed');
  }

  getStats() {
    return this.cache.getStats();
  }
}

export const cacheService = new CacheService();
