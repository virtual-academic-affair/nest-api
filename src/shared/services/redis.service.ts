import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import Redis from 'ioredis';
import redisConfig from '@shared/config/redis.config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(@Inject(redisConfig.KEY) private readonly redisConfiguration: ConfigType<typeof redisConfig>) {}

  onModuleInit() {
    this.client = new Redis(this.redisConfiguration.url);

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error', err);
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  // ============================
  // Key-value
  // ============================
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
      return;
    }

    await this.client.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }

  // ============================
  // HASH (HSET, HGET, HDEL,...)
  // ============================
  async hset(key: string, field: string, value: string): Promise<void> {
    await this.client.hset(key, field, value);
  }

  async hmset(key: string, values: Record<string, string>): Promise<void> {
    await this.client.hmset(key, values);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  async hdel(key: string, field: string): Promise<void> {
    await this.client.hdel(key, field);
  }

  async hexists(key: string, field: string): Promise<boolean> {
    const result = await this.client.hexists(key, field);
    return result === 1;
  }
}
