import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { UpdateDto } from '@email/dtos/labels/update.dto';
import { getLangLabel, SystemLabel } from '@shared/enums/system-label.enum';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';
import { GoogleapisService } from './googleapis.service';

@Injectable()
export class LabelsService {
  constructor(
    private readonly settingService: SettingService,
    private readonly googleapisService: GoogleapisService,
  ) {}

  async findAllGmailLabels() {
    const client = await this.googleapisService.getGmailClient();
    const { data } = await client.users.labels.list({ userId: 'me' });
    return (data.labels ?? [])
      .filter((label) => label.type !== 'system')
      .map((label) => ({ label: label.name, value: label.id }));
  }

  private async createGmailLabel(name: string, color: string): Promise<string> {
    const client = await this.googleapisService.getGmailClient();

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

  async findAll(): Promise<UpdateDto> {
    return await this.settingService.get<UpdateDto>(SettingKey.EmailLabels);
  }

  async update(dto: UpdateDto) {
    await this.settingService.set(SettingKey.EmailLabels, dto);
  }

  async autoCreateLabels(): Promise<UpdateDto> {
    await this.createGmailLabel(getLangLabel('parent'), getLangLabel('parent', 'color'));

    const labels = (await this.findAll()) || ({} as UpdateDto);
    const missingKeys = Object.values(SystemLabel).filter((key) => !labels[key]);

    const parent = getLangLabel('parent');
    const newEntries = await Promise.all(
      missingKeys.map(async (key) => [
        key,
        await this.createGmailLabel(parent + getLangLabel(key), getLangLabel(key, 'color')),
      ]),
    );
    Object.assign(labels, Object.fromEntries(newEntries));

    await this.update(labels);
    return labels;
  }
}
