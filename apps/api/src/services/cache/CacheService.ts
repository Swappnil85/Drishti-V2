/**
 * Cache Service for API Response Caching
 * Supports Redis and in-memory caching with intelligent invalidation
 */

import Redis from 'ioredis';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  compress?: boolean;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  compressed?: boolean;
}

class CacheService {
  private redis: Redis | null = null;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private useRedis: boolean = false;
  private defaultTTL: number = 300; // 5 minutes
  private maxMemoryEntries: number = 1000;

  constructor() {
    this.initializeRedis();
    this.startCleanupInterval();
  }

  private async initializeRedis() {
    try {
      const redisUrl = process.env.REDIS_URL;
      if (redisUrl) {
        this.redis = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });

        await this.redis.ping();
        this.useRedis = true;
        console.log('✅ Redis cache connected');
      } else {
        console.log('📝 Using in-memory cache (Redis not configured)');
      }
    } catch (error) {
      console.warn(
        '⚠️ Redis connection failed, falling back to memory cache:',
        error
      );
      this.useRedis = false;
    }
  }

  private startCleanupInterval() {
    // Clean up expired memory cache entries every 5 minutes
    setInterval(
      () => {
        this.cleanupMemoryCache();
      },
      5 * 60 * 1000
    );
  }

  private cleanupMemoryCache() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    // If still too many entries, remove oldest ones
    if (this.memoryCache.size > this.maxMemoryEntries) {
      const entries = Array.from(this.memoryCache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp
      );

      const toRemove = entries.slice(
        0,
        this.memoryCache.size - this.maxMemoryEntries
      );
      toRemove.forEach(([key]) => this.memoryCache.delete(key));
      cleaned += toRemove.length;
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }

  private buildKey(key: string, prefix?: string): string {
    const finalPrefix = prefix || 'drishti:api';
    return `${finalPrefix}:${key}`;
  }

  private compressData(data: any): string {
    // Simple JSON compression - in production, consider using actual compression
    return JSON.stringify(data);
  }

  private decompressData(data: string): any {
    return JSON.parse(data);
  }

  async get<T = any>(
    key: string,
    options: CacheOptions = {}
  ): Promise<T | null> {
    const cacheKey = this.buildKey(key, options.prefix);

    try {
      if (this.useRedis && this.redis) {
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          const entry: CacheEntry = JSON.parse(cached);
          return options.compress
            ? this.decompressData(entry.data)
            : entry.data;
        }
      } else {
        const entry = this.memoryCache.get(cacheKey);
        if (entry) {
          const now = Date.now();
          if (now - entry.timestamp <= entry.ttl * 1000) {
            return entry.compressed
              ? this.decompressData(entry.data)
              : entry.data;
          } else {
            this.memoryCache.delete(cacheKey);
          }
        }
      }
    } catch (error) {
      console.error('Cache get error:', error);
    }

    return null;
  }

  async set(key: string, data: any, options: CacheOptions = {}): Promise<void> {
    const cacheKey = this.buildKey(key, options.prefix);
    const ttl = options.ttl || this.defaultTTL;
    const compress = options.compress || false;

    const entry: CacheEntry = {
      data: compress ? this.compressData(data) : data,
      timestamp: Date.now(),
      ttl,
      compressed: compress,
    };

    try {
      if (this.useRedis && this.redis) {
        await this.redis.setex(cacheKey, ttl, JSON.stringify(entry));
      } else {
        this.memoryCache.set(cacheKey, entry);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async delete(key: string, options: CacheOptions = {}): Promise<void> {
    const cacheKey = this.buildKey(key, options.prefix);

    try {
      if (this.useRedis && this.redis) {
        await this.redis.del(cacheKey);
      } else {
        this.memoryCache.delete(cacheKey);
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async invalidatePattern(
    pattern: string,
    options: CacheOptions = {}
  ): Promise<void> {
    const fullPattern = this.buildKey(pattern, options.prefix);

    try {
      if (this.useRedis && this.redis) {
        const keys = await this.redis.keys(fullPattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        const keysToDelete: string[] = [];
        for (const key of this.memoryCache.keys()) {
          if (key.includes(pattern)) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach(key => this.memoryCache.delete(key));
      }
    } catch (error) {
      console.error('Cache invalidate pattern error:', error);
    }
  }

  async clear(prefix?: string): Promise<void> {
    try {
      if (this.useRedis && this.redis) {
        const pattern = this.buildKey('*', prefix);
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        if (prefix) {
          const fullPrefix = this.buildKey('', prefix);
          const keysToDelete: string[] = [];
          for (const key of this.memoryCache.keys()) {
            if (key.startsWith(fullPrefix)) {
              keysToDelete.push(key);
            }
          }
          keysToDelete.forEach(key => this.memoryCache.delete(key));
        } else {
          this.memoryCache.clear();
        }
      }
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  getStats(): any {
    return {
      type: this.useRedis ? 'redis' : 'memory',
      memoryEntries: this.memoryCache.size,
      maxMemoryEntries: this.maxMemoryEntries,
      defaultTTL: this.defaultTTL,
      redisConnected: this.useRedis && this.redis?.status === 'ready',
    };
  }

  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

export const cacheService = new CacheService();
