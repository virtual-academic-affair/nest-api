import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Role } from '@authentication/enums/role.enum';
import { UpdateAllowedDomainsDto } from '@email/dtos/allowed-domains/update.dto';
import { Body, Controller, Get, Put } from '@nestjs/common';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('email/allowedDomains')
export class AllowedDomainsController {
  constructor(private readonly settingService: SettingService) {}

  @Get()
  async get() {
    return await this.settingService.get<string[]>(
      SettingKey.EmailAllowedDomains
    );
  }

  @Put()
  async update(@Body() dto: UpdateAllowedDomainsDto) {
    return this.settingService.set(SettingKey.EmailAllowedDomains, dto.domains);
  }
}
