import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Redis } from 'ioredis';
import { Repository } from 'typeorm';
import { RedisService } from '@shared/redis/redis.service';
import { Setting } from '@shared/setting/entities/setting.entity';

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
    const cacheKey = this.cacheKey(key);
    const cached = await this.redis.get(cacheKey);

    if (cached !== null) {
      try {
        return JSON.parse(cached) as T;
      } catch {
        await this.redis.del(cacheKey);
      }
    }

    const setting = await this.settingRepository.findOneBy({ key });
    const value = setting?.value ?? null;

    this.redis
      .set(cacheKey, JSON.stringify(value), 'EX', SettingService.CACHE_TTL_SECONDS)
      .catch((err) => console.error(`[Redis] Failed to set ${cacheKey}:`, err));

    return value as T;
  }

  async set<T>(key: string, value: T, isPartial = false): Promise<Setting> {
    const saved = await this.settingRepository.manager.transaction(async (trans) => {
      const existing = await trans.findOne(Setting, { where: { key: key }, lock: { mode: 'pessimistic_write' } });

      const finalValue =
        isPartial && existing?.value && typeof existing.value === 'object'
          ? ({ ...existing.value, ...value } as T)
          : value;

      return await trans.save(Setting, { ...existing, key, value: finalValue } as Setting);
    });

    await this.redis.set(this.cacheKey(key), JSON.stringify(saved.value), 'EX', SettingService.CACHE_TTL_SECONDS);
    return saved;
  }

  async remove(key: string): Promise<void> {
    await this.settingRepository.delete({ key });
    await this.redis.del(this.cacheKey(key));
  }
}
