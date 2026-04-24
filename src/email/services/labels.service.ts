import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { getLangLabel, LabelKey, LabelLang } from '@email/enums/email-label.enum';
import { EmailLabelsDto } from '@shared/setting/dtos/email-labels.dto';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';
import { GmailApiService } from './gmail-api.service';

@Injectable()
export class LabelsService {
  constructor(
    private readonly settingService: SettingService,
    private readonly gmailApiService: GmailApiService,
  ) {}

  async findAllGmailLabels() {
    const client = await this.gmailApiService.getGmailClient();
    const { data } = await client.users.labels.list({ userId: 'me' });
    return (data.labels ?? [])
      .filter((label) => label.type !== 'system')
      .map((label) => ({ label: label.name, value: label.id }));
  }

  private async createGmailLabel(name: string, color: string): Promise<string> {
    const client = await this.gmailApiService.getGmailClient();

    try {
      const { data } = await client.users.labels.create({
        userId: 'me',
        requestBody: { name, color: { textColor: '#ffffff', backgroundColor: color } },
      });

      return data.id;
    } catch (error) {
      if (error.status === 409 || error.code === 409) {
        // Label already exists
        const labels = await this.findAllGmailLabels();
        const existingLabel = labels.find((label) => label.label === name);

        if (existingLabel) {
          return existingLabel.value;
        }
      }

      throw new InternalServerErrorException(`Failed to create or find label: ${name}. Error: ${error.message}`);
    }
  }

  async findAll(): Promise<EmailLabelsDto> {
    return await this.settingService.get<EmailLabelsDto>(SettingKey.EmailLabels);
  }

  async update(dto: EmailLabelsDto) {
    await this.settingService.set(SettingKey.EmailLabels, dto);
  }

  async autoCreateLabels(): Promise<void> {
    const parentId = await this.createGmailLabel(getLangLabel('parent'), getLangLabel('parent', 'color'));

    const labels = (await this.findAll()) || ({} as Record<LabelKey, string>);
    (labels as Record<string, string>)['parent'] = parentId;
    const missingKeys = (Object.keys(LabelLang) as LabelKey[]).filter((key) => !labels[key] && key !== 'parent');

    const parent = getLangLabel('parent');
    const newEntries = await Promise.all(
      missingKeys.map(async (key) => [
        key,
        await this.createGmailLabel(`${parent}/${getLangLabel(key)}`, getLangLabel(key, 'color')),
      ]),
    );
    Object.assign(labels, Object.fromEntries(newEntries));

    await this.update(labels);
  }
}
