import { Injectable } from '@nestjs/common';
import { Role } from '@authentication/enums/role.enum';
import { SystemLabel, SystemLabelLang } from '@shared/enums/system-label.enum';
import { SettingService } from '@shared/setting/services/setting.service';

const EnumRegistry = {
  shared: {
    systemLabel: { SystemLabel, SystemLabelLang },
  },
  authentication: {
    role: { Role },
  },
};

@Injectable()
export class DynamicDataService {
  constructor(private readonly settingService: SettingService) {}

  async getSettings(keys: string[]): Promise<Record<string, any>> {
    const settings = await Promise.all(keys.map(async (key) => [key, await this.settingService.get(key)]));
    return Object.fromEntries(settings);
  }

  async getEnums(enumPaths: string[]): Promise<Record<string, any>> {
    const result: Record<string, any> = {};

    for (const enumPath of enumPaths) {
      try {
        const [modulePath, fileName] = enumPath.split('.');
        result[enumPath] = EnumRegistry[modulePath]?.[fileName] || null;
      } catch (error) {
        result[enumPath] = null;
      }
    }

    return result;
  }
}
