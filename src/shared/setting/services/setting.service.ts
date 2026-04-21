import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RedisService } from '@shared/redis/redis.service';
import { Setting } from '@shared/setting/entities/setting.entity';
import type { Redis } from 'ioredis';
import { Repository } from 'typeorm';

@Injectable()
export class SettingService {
  private static readonly CACHE_TTL_SECONDS = 60 * 5;
  private readonly redis: Redis;

  constructor(
    @InjectRepository(Setting) private readonly settingRepository: Repository<Setting>,
    redisService: RedisService,
  ) {
    this.redis = redisService.getOrThrow();
  }

  private cacheKey(key: string): string {
    return `setting:${key}`;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const cached = await this.redis.get(this.cacheKey(key));
    if (cached != null) {
      try {
        return JSON.parse(cached) as T;
      } catch {}
    }

    const setting = await this.settingRepository.findOneBy({ key });
    if (!setting) {
      return null;
    }

    await this.redis.set(this.cacheKey(key), JSON.stringify(setting.value), 'EX', SettingService.CACHE_TTL_SECONDS);
    return setting.value as T;
  }

  async set<T>(key: string, value: T, isPartial = false): Promise<Setting> {
    const existing = await this.settingRepository.findOneBy({ key });
    value = isPartial && typeof existing?.value === 'object' ? ({ ...existing.value, ...value } as T) : value;

    const saved = await this.settingRepository.save({ ...existing, key, value } as Setting);
    await this.redis.set(this.cacheKey(key), JSON.stringify(saved.value), 'EX', SettingService.CACHE_TTL_SECONDS);
    return saved;
  }
}
