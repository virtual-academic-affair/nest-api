import { Injectable } from '@nestjs/common';
import { Message } from '@email/entities/message.entity';
import { LabelKey, LabelLang } from '@email/enums/label.enum';
import { GmailLabelingService } from '@email/services/gmail/labeling/labeling.service';
import { LabelsDto } from '@shared/setting/dtos/email-labels.dto';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

@Injectable()
export class LabelsService {
  constructor(
    private readonly settingService: SettingService,
    private readonly gmailLabelingService: GmailLabelingService,
  ) {}

  async findAllGmailLabels() {
    return await this.gmailLabelingService.list();
  }

  async create(key: LabelKey): Promise<string> {
    const newLabelId = await this.gmailLabelingService.create(LabelLang[key]);
    await this.settingService.set(SettingKey.EmailLabels, { [key]: newLabelId }, true);

    return newLabelId;
  }

  async getId(key: LabelKey, force: boolean = false): Promise<string | null> {
    const labels = await this.settingService.get<LabelsDto>(SettingKey.EmailLabels);
    return labels?.[key] ?? (force ? await this.create(key) : null);
  }

  async label(message: Message, toAdds: LabelKey[], toRemoves: LabelKey[], force: false): Promise<void> {
    if (toAdds.length === 0 && toRemoves.length === 0) {
      return;
    }

    const labels = await this.settingService.get<LabelsDto>(SettingKey.EmailLabels);

    return this.gmailLabelingService.label(
      message.gmailMessageId,
      await Promise.all(
        toAdds.map((key) => labels[key] ?? (force ? this.gmailLabelingService.create(LabelLang[key]) : null)),
      ),
      toRemoves.map((label) => labels[label] as string),
    );
  }
}
