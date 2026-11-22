import { Redis } from '@upstash/redis';
import { logger } from './logger.js';

const MAX_MEMORY_ENTRIES = 500;

class MemoryTtlCache {
  constructor(maxEntries = MAX_MEMORY_ENTRIES) {
    this.maxEntries = maxEntries;
    this.store = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses += 1;
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses += 1;
      return null;
    }
    // Refresh LRU order
    this.store.delete(key);
    this.store.set(key, entry);
    this.hits += 1;
    return entry.value;
  }

  set(key, value, ttlSeconds = 60) {
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey !== undefined) {
        this.store.delete(oldestKey);
      }
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }

  del(key) {
    this.store.delete(key);
  }

  stats() {
    return {
      backend: 'memory-lru',
      size: this.store.size,
      maxEntries: this.maxEntries,
      hits: this.hits,
      misses: this.misses
    };
  }
}

const memoryCache = new MemoryTtlCache();
let redisClient = null;
let redisChecked = false;

export function getRedisClient() {
  if (redisChecked) return redisClient;
  redisChecked = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      redisClient = new Redis({ url, token });
      logger.info({ backend: 'upstash-redis' }, 'Distributed Redis cache enabled');
    } catch (err) {
      logger.warn({ err: err.message }, 'Failed to initialize Upstash Redis, using memory cache');
      redisClient = null;
    }
  }
  return redisClient;
}

export async function cacheGet(key) {
  const redis = getRedisClient();
  if (redis) {
    try {
      const val = await redis.get(key);
      if (val !== null && val !== undefined) return val;
      return null;
    } catch (err) {
      logger.warn({ err: err.message, key }, 'Redis GET failed, falling back to memory cache');
    }
  }
  return memoryCache.get(key);
}

export async function cacheSet(key, value, ttlSeconds = 60) {
  memoryCache.set(key, value, ttlSeconds);
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.set(key, value, { ex: ttlSeconds });
    } catch (err) {
      logger.warn({ err: err.message, key }, 'Redis SET failed, memory cache retained');
    }
  }
}

export async function cacheDel(key) {
  memoryCache.del(key);
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.del(key);
    } catch (err) {
      logger.warn({ err: err.message, key }, 'Redis DEL failed');
    }
  }
}

/**
 * Creates an express-rate-limit v8 compatible Store backed by Upstash Redis
 * when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are configured.
 * Returns undefined when Redis is not configured so express-rate-limit uses MemoryStore.
 */
export function createRateLimitStore(prefix = 'rl') {
  const redis = getRedisClient();
  if (!redis) return undefined;

  let windowMs = 15 * 60 * 1000;

  return {
    localKeys: false,
    prefix: `travelops:${prefix}:`,
    init(options) {
      if (options?.windowMs) windowMs = options.windowMs;
    },
    async increment(key) {
      const fullKey = `${this.prefix}${key}`;
      const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000));
      try {
        const totalHits = await redis.incr(fullKey);
        if (totalHits === 1) {
          await redis.expire(fullKey, ttlSeconds);
        }
        const remainingTtl = await redis.ttl(fullKey);
        const resetTime = new Date(Date.now() + Math.max(1, remainingTtl) * 1000);
        return { totalHits, resetTime };
      } catch (err) {
        logger.warn({ err: err.message, fullKey }, 'Redis rate-limit increment failed; allowing request');
        return { totalHits: 1, resetTime: new Date(Date.now() + windowMs) };
      }
    },
    async decrement(key) {
      const fullKey = `${this.prefix}${key}`;
      try {
        await redis.decr(fullKey);
      } catch {
        // Ignore
      }
    },
    async resetKey(key) {
      const fullKey = `${this.prefix}${key}`;
      try {
        await redis.del(fullKey);
      } catch {
        // Ignore
      }
    }
  };
}

export function getCacheStatus() {
  const redis = getRedisClient();
  return {
    redisConfigured: Boolean(redis),
    ...memoryCache.stats()
  };
}
