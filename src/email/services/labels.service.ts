import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SuperEmail } from '@authentication/strategies/google-gmail.strategy';
import { GMAIL_ACTION_TRIGGERED_EVENT } from '@email/constants/gmail-log.constants';
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
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async findAllGmailLabels() {
    return await this.gmailLabelingService.list();
  }

  async create(key: LabelKey): Promise<string> {
    const accountEmail = await this.getAccountEmail();

    try {
      const newLabelId = await this.gmailLabelingService.create(LabelLang[key]);
      await this.settingService.set(SettingKey.EmailLabels, { [key]: newLabelId }, true);
      this.eventEmitter.emit(GMAIL_ACTION_TRIGGERED_EVENT, {
        accountEmail,
        action: `Tạo nhãn: ${LabelLang[key].name}`,
        status: 'success',
        suppressDetailLink: true,
        dedupeKey: `label:create:${key}`,
      });

      return newLabelId;
    } catch (error: any) {
      this.eventEmitter.emit(GMAIL_ACTION_TRIGGERED_EVENT, {
        accountEmail,
        action: `Tạo nhãn: ${LabelLang[key].name}`,
        status: 'failed',
        suppressDetailLink: true,
        error: error?.message ?? String(error),
        dedupeKey: `label:create:${key}`,
      });
      throw error;
    }
  }

  async getId(key: LabelKey, force: boolean = false): Promise<string | null> {
    const labels = await this.settingService.get<LabelsDto>(SettingKey.EmailLabels);
    return labels?.[key] ?? (force ? await this.create(key) : null);
  }

  async label(
    message: Message,
    toAdds: LabelKey[] = [],
    toRemoves: LabelKey[] = [],
    force: boolean = false,
    actorEmail?: string | null,
  ): Promise<void> {
    if (toAdds.length === 0 && toRemoves.length === 0) {
      return;
    }

    const labels = await this.settingService.get<LabelsDto>(SettingKey.EmailLabels);
    const addIds = (
      await Promise.all(
        toAdds.map((key) => labels[key] ?? (force ? this.gmailLabelingService.create(LabelLang[key]) : null)),
      )
    ).filter((label): label is string => !!label);
    const removeIds = toRemoves.map((label) => labels[label] as string).filter(Boolean);
    const accountEmail = actorEmail ?? message.superEmail ?? (await this.getAccountEmail());
    const from = message.senderName ?? message.senderEmail ?? null;
    const to = accountEmail ?? null;

    try {
      await this.gmailLabelingService.label(message.gmailMessageId, addIds, removeIds);

      for (const key of toAdds) {
        this.eventEmitter.emit(GMAIL_ACTION_TRIGGERED_EVENT, {
          accountEmail,
          action: `Gắn nhãn: ${LabelLang[key].name}`,
          status: 'success',
          from,
          to,
          gmailMessageId: message.gmailMessageId,
          dedupeKey: `label:add:${message.gmailMessageId}:${key}`,
        });
      }

      for (const key of toRemoves) {
        this.eventEmitter.emit(GMAIL_ACTION_TRIGGERED_EVENT, {
          accountEmail,
          action: `Xóa nhãn: ${LabelLang[key].name}`,
          status: 'success',
          from,
          to,
          gmailMessageId: message.gmailMessageId,
          dedupeKey: `label:remove:${message.gmailMessageId}:${key}`,
        });
      }
    } catch (error: any) {
      for (const key of toAdds) {
        this.eventEmitter.emit(GMAIL_ACTION_TRIGGERED_EVENT, {
          accountEmail,
          action: `Gắn nhãn: ${LabelLang[key].name}`,
          status: 'failed',
          from,
          to,
          gmailMessageId: message.gmailMessageId,
          error: error?.message ?? String(error),
          dedupeKey: `label:add:${message.gmailMessageId}:${key}`,
        });
      }

      for (const key of toRemoves) {
        this.eventEmitter.emit(GMAIL_ACTION_TRIGGERED_EVENT, {
          accountEmail,
          action: `Xóa nhãn: ${LabelLang[key].name}`,
          status: 'failed',
          from,
          to,
          gmailMessageId: message.gmailMessageId,
          error: error?.message ?? String(error),
          dedupeKey: `label:remove:${message.gmailMessageId}:${key}`,
        });
      }

      throw error;
    }
  }

  private async getAccountEmail(): Promise<string | null> {
    return (await this.settingService.get<SuperEmail>(SettingKey.EmailSuperEmail))?.email ?? null;
  }
}
