import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Message } from '@email/entities/message.entity';
import { GoogleapisService } from '@email/services/googleapis.service';
import { LabelsService } from '@email/services/labels.service';
import { InquiryType } from '@inquiry/enums/inquiry-type.enum';

@Injectable()
export class InquiryTypeLabelsService {
  constructor(
    private readonly googleapisService: GoogleapisService,
    private readonly labelsService: LabelsService,
    private readonly dataSource: DataSource,
  ) {}

  async run(messageId: number, newTypes: InquiryType[], oldTypes: InquiryType[] = []): Promise<void> {
    const labelMapping = await this.labelsService.autoCreateInquiryTypeLabels();

    await this.dataSource.transaction(async (manager) => {
      const message = await manager.findOneOrFail(Message, {
        where: { id: messageId },
        lock: { mode: 'pessimistic_write' },
      });

      const addedTypes = newTypes.filter((type) => !oldTypes.includes(type));
      const removedTypes = oldTypes.filter((type) => !newTypes.includes(type));

      const toAdd = addedTypes.map((type) => labelMapping[type]).filter(Boolean);
      const toRemove = removedTypes.map((type) => labelMapping[type]).filter(Boolean);

      if (!toAdd.length && !toRemove.length) {
        return;
      }

      const gmail = await this.googleapisService.getGmailClient();
      const { data } = await gmail.users.messages.modify({
        userId: 'me',
        id: message.gmailMessageId,
        requestBody: { addLabelIds: toAdd, removeLabelIds: toRemove },
      });

      await manager.update(Message, message.id, { labelIds: data.labelIds ?? message.labelIds });
    });
  }
}
