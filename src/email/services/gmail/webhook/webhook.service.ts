import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PayloadDto } from '@email/dtos/webhook/payload.dto';
import { Message } from '@email/entities/message.entity';
import { HistoryService } from '@email/services/gmail/webhook/history.service';
import { IngestService } from '@email/services/gmail/webhook/ingest.service';
import { LabelsService } from '@email/services/labels.service';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

@Injectable()
export class WebhookService {
  constructor(
    private readonly historyService: HistoryService,
    private readonly ingestService: IngestService,
    private readonly settingService: SettingService,
    private readonly labelsService: LabelsService,
    @InjectRepository(Message) private readonly messageRepository: Repository<Message>,
  ) {}

  async handle(payload: PayloadDto): Promise<void> {
    const historyId = String(payload.historyId);
    const [parentLabelId, previousHistoryId] = await Promise.all([
      this.labelsService.getId('parent', true),
      this.settingService.get<string>(SettingKey.EmailGmailHistoryId),
    ]);

    if (!previousHistoryId) {
      await this.settingService.set(SettingKey.EmailGmailHistoryId, historyId);
      return;
    }

    const { addedMessageIds, removedMessageIds, latestHistoryId } = await this.historyService.listLabelDelta(
      previousHistoryId,
      parentLabelId,
      payload.emailAddress,
    );

    await this.settingService.set(SettingKey.EmailGmailHistoryId, latestHistoryId ?? historyId);
    await Promise.all([this.handleAdded(addedMessageIds), this.handleRemoved(removedMessageIds)]);
  }

  private async handleAdded(gmailMessageIds: string[]): Promise<void> {
    if (gmailMessageIds.length === 0) {
      return;
    }

    await this.ingestService.ingestMessages(gmailMessageIds);
  }

  private async handleRemoved(gmailMessageIds: string[]): Promise<void> {
    if (gmailMessageIds.length === 0) {
      return;
    }

    await this.messageRepository.delete({ gmailMessageId: In(gmailMessageIds) });
  }
}
