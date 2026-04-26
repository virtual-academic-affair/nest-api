import { BadRequestException, Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { Auth, AuthType } from '@authentication/decorators/auth.decorator';
import { Role, Roles } from '@authentication/decorators/roles.decorator';
import { WatchService } from '@email/services/gmail/webhook/watch.service';
import { validateDto } from '@shared/resource/utils/validate-dto.util';
import { AuthRoleDomainsDto } from '@shared/setting/dtos/auth-email-domains.dto';
import { LabelsDto } from '@shared/setting/dtos/email-labels.dto';
import { SettingsQueryDto } from '@shared/setting/dtos/settings-query.dto';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

type SettingConfig = {
  dto: new () => any;
  postProcess?: (oldValue: unknown, currentValue?: unknown) => Promise<void>;
};

@Controller('shared/settings')
@Auth(AuthType.Jwt)
@Roles(Role.Admin)
export class SettingsController {
  private readonly configByKey: Partial<Record<SettingKey, SettingConfig>>;

  constructor(
    private readonly settingService: SettingService,
    private readonly watchService: WatchService,
  ) {
    this.configByKey = {
      [SettingKey.AuthRoleDomains]: {
        dto: AuthRoleDomainsDto,
        postProcess: async (oldValue: unknown, currentValue: unknown = oldValue): Promise<void> => {
          if (!(typeof currentValue === 'object' && currentValue !== null && Role.Student in currentValue)) {
            return;
          }
          await this.watchService.sync('manual');
        },
      },
      [SettingKey.EmailLabels]: { dto: LabelsDto },
    };
  }

  @Get()
  async get(@Query() query: SettingsQueryDto) {
    const entries = await Promise.all(
      query.keys.map(async (key) => [key, await this.settingService.get(key)] as const),
    );

    return Object.fromEntries(entries);
  }

  @Put(':key')
  async update(@Param('key') key: SettingKey, @Body() body: unknown) {
    const config = this.configByKey[key];
    throwUnless(config, new BadRequestException(`Unsupported setting key: ${key}`));

    const oldValue = await this.settingService.get(key);
    await validateDto(config.dto, body, true);
    await this.settingService.set(key, body, true);
    const currentValue = await this.settingService.get(key);
    await config.postProcess?.(oldValue, currentValue);
  }
}
