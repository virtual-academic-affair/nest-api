import { Body, Controller, Get, Put } from '@nestjs/common';
import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Role } from '@authentication/enums/role.enum';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('email/canSaveContent')
export class CanSaveContentController {
  constructor(private readonly settingService: SettingService) {}

  @Get()
  async get() {
    return await this.settingService.get<boolean>(SettingKey.EmailCanSaveContent);
  }

  @Put()
  async update(@Body() { canSaveContent }: { canSaveContent: boolean }) {
    return this.settingService.set(SettingKey.EmailCanSaveContent, !!canSaveContent);
  }
}
