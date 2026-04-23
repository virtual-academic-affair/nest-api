import { Injectable } from '@nestjs/common';
import { EmailLabel } from '@email/enums/email-label.enum';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

@Injectable()
export class GmailLabelIdsService {
  constructor(private readonly settingService: SettingService) {}

  async getId(label: EmailLabel): Promise<string | null> {
    const mapping = (await this.settingService.get<Record<string, string>>(SettingKey.EmailLabels)) ?? {};
    const id = mapping[label]?.trim();
    return id || null;
  }
}
