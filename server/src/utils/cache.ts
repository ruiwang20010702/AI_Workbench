import { createClient, RedisClientType } from 'redis';

/**
 * 缓存服务类
 * 使用 Redis 实现缓存功能，如果 Redis 不可用则降级为内存缓存
 */
export class CacheService {
  private static redisClient: RedisClientType | null = null;
  private static memoryCache: Map<string, { value: any; expiry: number }> = new Map();
  private static isRedisAvailable: boolean = false;
  private static readonly DEFAULT_TTL = 300; // 默认5分钟

  /**
   * 初始化 Redis 客户端
   */
  static async initialize(): Promise<void> {
    // 如果没有配置 Redis URL，则使用内存缓存
    if (!process.env.REDIS_URL) {
      console.log('[CacheService] Redis URL not configured, using memory cache');
      this.isRedisAvailable = false;
      return;
    }

    try {
      this.redisClient = createClient({
        url: process.env.REDIS_URL,
      });

      this.redisClient.on('error', (err) => {
        console.error('[CacheService] Redis Client Error:', err);
        this.isRedisAvailable = false;
      });

      this.redisClient.on('connect', () => {
        console.log('[CacheService] Redis connected successfully');
        this.isRedisAvailable = true;
      });

      await this.redisClient.connect();
    } catch (error) {
      console.error('[CacheService] Failed to connect to Redis:', error);
      this.isRedisAvailable = false;
      this.redisClient = null;
    }
  }

  /**
   * 设置缓存
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间（秒），默认300秒
   */
  static async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);

      if (this.isRedisAvailable && this.redisClient) {
        // 使用 Redis
        await this.redisClient.setEx(key, ttl, serializedValue);
      } else {
        // 使用内存缓存
        const expiry = Date.now() + ttl * 1000;
        this.memoryCache.set(key, { value: serializedValue, expiry });
      }
    } catch (error) {
      console.error('[CacheService] Error setting cache:', error);
    }
  }

  /**
   * 获取缓存
   * @param key 缓存键
   * @returns 缓存值，不存在或已过期返回 null
   */
  static async get<T = any>(key: string): Promise<T | null> {
    try {
      let serializedValue: string | null = null;

      if (this.isRedisAvailable && this.redisClient) {
        // 从 Redis 获取
        serializedValue = await this.redisClient.get(key);
      } else {
        // 从内存缓存获取
        const cached = this.memoryCache.get(key);
        if (cached) {
          if (Date.now() > cached.expiry) {
            // 已过期，删除
            this.memoryCache.delete(key);
            return null;
          }
          serializedValue = cached.value;
        }
      }

      if (!serializedValue) {
        return null;
      }

      return JSON.parse(serializedValue) as T;
    } catch (error) {
      console.error('[CacheService] Error getting cache:', error);
      return null;
    }
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  static async delete(key: string): Promise<void> {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        await this.redisClient.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (error) {
      console.error('[CacheService] Error deleting cache:', error);
    }
  }

  /**
   * 删除匹配模式的所有缓存
   * @param pattern 匹配模式（例如：'weekly_data_*'）
   */
  static async deletePattern(pattern: string): Promise<void> {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      } else {
        // 内存缓存：删除匹配的键
        const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            this.memoryCache.delete(key);
          }
        }
      }
    } catch (error) {
      console.error('[CacheService] Error deleting pattern:', error);
    }
  }

  /**
   * 检查缓存是否存在
   * @param key 缓存键
   */
  static async exists(key: string): Promise<boolean> {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        const result = await this.redisClient.exists(key);
        return result > 0;
      } else {
        const cached = this.memoryCache.get(key);
        if (!cached) return false;
        if (Date.now() > cached.expiry) {
          this.memoryCache.delete(key);
          return false;
        }
        return true;
      }
    } catch (error) {
      console.error('[CacheService] Error checking cache existence:', error);
      return false;
    }
  }

  /**
   * 清空所有缓存
   */
  static async clear(): Promise<void> {
    try {
      if (this.isRedisAvailable && this.redisClient) {
        await this.redisClient.flushAll();
      } else {
        this.memoryCache.clear();
      }
    } catch (error) {
      console.error('[CacheService] Error clearing cache:', error);
    }
  }

  /**
   * 关闭 Redis 连接
   */
  static async close(): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
      } catch (error) {
        console.error('[CacheService] Error closing Redis connection:', error);
      }
    }
  }

  /**
   * 获取缓存状态
   */
  static getStatus(): { type: 'redis' | 'memory'; available: boolean } {
    return {
      type: this.isRedisAvailable ? 'redis' : 'memory',
      available: this.isRedisAvailable || true, // 内存缓存始终可用
    };
  }

  /**
   * 定期清理内存缓存中的过期项
   */
  static startMemoryCacheCleanup(intervalMs: number = 60000): NodeJS.Timeout {
    return setInterval(() => {
      if (!this.isRedisAvailable) {
        const now = Date.now();
        for (const [key, cached] of this.memoryCache.entries()) {
          if (now > cached.expiry) {
            this.memoryCache.delete(key);
          }
        }
      }
    }, intervalMs);
  }
}

