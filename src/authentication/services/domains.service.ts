import { Injectable } from '@nestjs/common';
import { Role } from '@authentication/decorators/roles.decorator';
import { RoleDomains, resolveEmail } from '@authentication/utils/resolve-email.util';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

@Injectable()
export class DomainsService {
  constructor(private readonly settingService: SettingService) {}

  async getDomains(role: Role): Promise<string[]> {
    const domainsByRole = await this.settingService.get<RoleDomains>(SettingKey.AuthEmailDomains);
    return domainsByRole[role] ?? [];
  }

  async resolveIdentity(email: string): Promise<{ role: Role; profile?: unknown } | null> {
    const domainsByRole = await this.settingService.get<RoleDomains>(SettingKey.AuthEmailDomains);
    return resolveEmail(email, domainsByRole);
  }
}
