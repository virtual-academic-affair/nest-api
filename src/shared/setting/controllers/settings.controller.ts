import { BadRequestException, Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { Auth, AuthType } from '@authentication/decorators/auth.decorator';
import { Role, Roles } from '@authentication/decorators/roles.decorator';
import { validateDto } from '@shared/resource/utils/validate-dto.util';
import { AuthEmailDomainsDto } from '@shared/setting/dtos/auth-email-domains.dto';
import { EmailLabelsDto } from '@shared/setting/dtos/email-labels.dto';
import { SettingsQueryDto } from '@shared/setting/dtos/settings-query.dto';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

@Controller('shared/settings')
@Auth(AuthType.Jwt)
@Roles(Role.Admin)
export class SettingsController {
  private readonly configByKey: Partial<Record<SettingKey, { dto: new () => any }>>;

  constructor(private readonly settingService: SettingService) {
    this.configByKey = {
      [SettingKey.AuthEmailDomains]: { dto: AuthEmailDomainsDto },
      [SettingKey.EmailLabels]: { dto: EmailLabelsDto },
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
    await validateDto(config.dto, body, true);
    await this.settingService.set(key, body, true);
  }
}
