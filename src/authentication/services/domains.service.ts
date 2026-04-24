import { Injectable } from '@nestjs/common';
import { Role } from '@authentication/decorators/roles.decorator';
import { User } from '@authentication/entities/user.entity';
import { StudentsService } from '@authentication/services/students.service';
import { RoleDomains, email2Role } from '@authentication/utils/student.util';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

@Injectable()
export class DomainsService {
  constructor(
    private readonly settingService: SettingService,
    private readonly studentsService: StudentsService,
  ) {}

  async getDomains(role: Role): Promise<string[]> {
    const roleDomains = await this.settingService.get<RoleDomains>(SettingKey.AuthRoleDomains);
    return roleDomains?.[role] ?? [];
  }

  async email2Identify(email: string): Promise<Partial<User>> {
    const domainsByRole = await this.settingService.get<RoleDomains>(SettingKey.AuthRoleDomains);
    const identity: Partial<User> = { role: email2Role(email, domainsByRole) };

    if (identity.role === Role.Student) {
      identity.studentCode = await this.studentsService.findByEmail(email).then((s) => s?.studentCode);
    }

    return identity;
  }
}
