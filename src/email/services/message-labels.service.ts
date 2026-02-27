import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Message } from '@email/entities/message.entity';
import { SystemLabel } from '@shared/enums/system-label.enum';
import { Setting } from '@shared/setting/entities/setting.entity';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { GoogleapisService } from './googleapis.service';

@Injectable()
export class MessageLabelsService {
  constructor(
    private readonly googleapisService: GoogleapisService,
    private readonly dataSource: DataSource,
  ) {}

  async run(messageId: number, newSystemLabels: SystemLabel[]): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const message = await manager.findOneOrFail(Message, {
        where: { id: messageId },
        lock: { mode: 'pessimistic_write' },
      });
      const labelMapping = await manager.findOneOrFail(Setting, {
        where: { key: SettingKey.EmailLabels },
        lock: { mode: 'pessimistic_write' },
      });
      const currentSystemLabels = message.systemLabels ?? [];

      const toAdd = newSystemLabels
        .filter((l) => !currentSystemLabels.includes(l))
        .map((l) => labelMapping.value[l] as string);
      const toRemove = currentSystemLabels
        .filter((l) => !newSystemLabels.includes(l))
        .map((l) => labelMapping.value[l] as string);
      console.log('toAdd', toAdd);
      console.log('toRemove', toRemove);
      if (toAdd.length === 0 && toRemove.length === 0) {
        return message;
      }

      const gmail = await this.googleapisService.getGmailClient();
      await gmail.users.messages.modify({
        userId: 'me',
        id: message.gmailMessageId,
        requestBody: { addLabelIds: toAdd, removeLabelIds: toRemove },
      });

      await manager.update(Message, message.id, { systemLabels: newSystemLabels });
    });
  }
}
