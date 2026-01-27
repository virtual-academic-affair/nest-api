import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SettingService } from '@shared/setting/services/setting.service';
import { GoogleapisService } from './googleapis.service';
import { getLangLabel, SystemLabel } from '@shared/enums/system-label.enum';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { UpdateDto } from '@email/dtos/labels/update.dto';

@Injectable()
export class LabelsService {
  constructor(
    private readonly settingService: SettingService,
    private readonly googleapisService: GoogleapisService
  ) {}

  async findAllGmailLabels() {
    const client = await this.googleapisService.getGmailClient();
    const { data } = await client.users.labels.list({ userId: 'me' });
    return (data.labels ?? [])
      .filter((label) => label.type !== 'system')
      .map((label) => ({
        label: label.name,
        value: label.id,
      }));
  }

  private async createGmailLabel(name: string): Promise<string> {
    const client = await this.googleapisService.getGmailClient();
    const { data } = await client.users.labels.create({
      userId: 'me',
      requestBody: { name },
    });

    throwUnless(
      data?.id,
      new InternalServerErrorException(`Failed to create label: ${name}`)
    );

    return data.id;
  }

  async findAll(): Promise<UpdateDto> {
    return await this.settingService.get<UpdateDto>(SettingKey.EmailLabels);
  }

  async update(dto: UpdateDto) {
    await this.settingService.set(SettingKey.EmailLabels, dto);
  }

  async autoCreateLabels(): Promise<UpdateDto> {
    const labels = (await this.findAll()) || ({} as UpdateDto);
    const missingKeys = Object.values(SystemLabel).filter(
      (key) => !labels[key]
    );

    const newEntries = await Promise.all(
      missingKeys.map(async (key) => [
        key,
        await this.createGmailLabel(getLangLabel(key)),
      ])
    );
    Object.assign(labels, Object.fromEntries(newEntries));

    await this.update(labels);
    return labels;
  }
}
