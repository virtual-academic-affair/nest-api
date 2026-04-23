import { Injectable } from '@nestjs/common';
import { Role } from '@authentication/enums/role.enum';
import { RoleDomains, resolveEmail } from '@authentication/utils/resolve-email.util';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

@Injectable()
export class EmailDomainsService {
  constructor(private readonly settingService: SettingService) {}

  async getDomains(role: Role): Promise<string[]> {
    const emailDomainsByRole = await this.settingService.get<RoleDomains>(SettingKey.AuthEmailDomains);
    return emailDomainsByRole[role] ?? [];
  }

  async resolveIdentity(email: string): Promise<{ role: Role; profile?: unknown } | null> {
    const emailDomainsByRole = await this.settingService.get<RoleDomains>(SettingKey.AuthEmailDomains);
    return resolveEmail(email, emailDomainsByRole);
  }
}
