import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(private readonly config: ConfigService) {
    this.client = new Redis(this.config.getOrThrow<string>('redis.url'));
  }

  /** Shared ioredis connection for the app. */
  getOrThrow(): Redis {
    return this.client;
  }

  onModuleDestroy() {
    void this.client.quit();
  }
}
