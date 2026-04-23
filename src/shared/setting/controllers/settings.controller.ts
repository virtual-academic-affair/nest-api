import { BadRequestException, Body, Controller, Param, Put } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { Auth, AuthType } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { Role } from '@authentication/enums/role.enum';
import { AuthEmailDomainsSettingDto } from '@shared/setting/dtos/auth-email-domains-setting.dto';
import { EmailLabelsSettingDto } from '@shared/setting/dtos/email-labels-setting.dto';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

type SettingConfig = {
  dto: new () => any;
};

@Controller('shared/settings')
@Auth(AuthType.Jwt)
@Roles(Role.Admin)
export class SettingsController {
  private readonly configByKey: Partial<Record<SettingKey, SettingConfig>>;

  constructor(private readonly settingService: SettingService) {
    this.configByKey = {
      [SettingKey.AuthEmailDomains]: {
        dto: AuthEmailDomainsSettingDto,
      },
      [SettingKey.EmailLabels]: {
        dto: EmailLabelsSettingDto,
      },
    };
  }

  @Put(':key')
  async update(@Param('key') key: SettingKey, @Body() body: unknown) {
    const config = this.configByKey[key];
    throwUnless(config, new BadRequestException(`Unsupported setting key: ${key}`));

    const dto = plainToInstance(config.dto, body);
    await validateOrReject(dto as object, { whitelist: true, forbidNonWhitelisted: true });

    const saved = await this.settingService.set(key, dto, true);
    return { key: saved.key, value: saved.value };
  }
}
