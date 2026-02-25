import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '@shared/setting/entities/setting.entity';

@Injectable()
export class SettingService {
  constructor(@InjectRepository(Setting) private readonly settingRepository: Repository<Setting>) {}

  async get<T = unknown>(key: string): Promise<T | null> {
    const setting = await this.settingRepository.findOneBy({ key });
    return setting ? (setting.value as T) : null;
  }

  async set<T>(key: string, value: T, isPartial = false): Promise<Setting> {
    const existing = await this.settingRepository.findOneBy({ key });
    value = isPartial && typeof existing?.value === 'object' ? ({ ...existing.value, ...value } as T) : value;
    return this.settingRepository.save({ ...existing, key, value } as Setting);
  }
}
