import { Injectable } from '@nestjs/common';
import { EmailLabel, LabelKey } from '@email/enums/email-label.enum';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';
import { GmailApiService } from './gmail-api.service';

type EmailLabelsSettingValue = Partial<Record<LabelKey, string | null>>;
const PARENT_LABEL_NAME = 'VAA';

@Injectable()
export class GmailLabelIdsService {
  constructor(
    private readonly settingService: SettingService,
    private readonly gmailApiService: GmailApiService,
  ) {}

  async getId(label: EmailLabel | 'parent'): Promise<string | null> {
    const mapping = (await this.settingService.get<EmailLabelsSettingValue>(SettingKey.EmailLabels)) ?? {};
    const id = mapping[label]?.trim();
    return id || null;
  }

  async ensureParentId(): Promise<string> {
    const configured = await this.getId('parent');
    if (configured) {
      return configured;
    }

    const gmail = await this.gmailApiService.getGmailClient();
    const { data: labelsData } = await gmail.users.labels.list({ userId: 'me' });
    const existing = labelsData.labels?.find(
      (label) => label.type !== 'system' && label.name === PARENT_LABEL_NAME,
    )?.id;

    if (existing) {
      await this.settingService.set(SettingKey.EmailLabels, { parent: existing }, true);
      return existing;
    }

    const { data: created } = await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: PARENT_LABEL_NAME,
        color: { textColor: '#ffffff', backgroundColor: '#6b7280' },
      },
    });
    throwUnless(created.id, new Error('Unable to create VAA label'));

    await this.settingService.set(SettingKey.EmailLabels, { parent: created.id }, true);
    return created.id;
  }
}
