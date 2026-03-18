import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { Message } from '@email/entities/message.entity';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
import { SystemLabel } from '@shared/enums/system-label.enum';
import { Setting } from '@shared/setting/entities/setting.entity';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { Task } from '@task/entities/task.entity';
import { GoogleapisService } from './googleapis.service';

@Injectable()
export class MessageLabelsService {
  constructor(
    private readonly googleapisService: GoogleapisService,
    private readonly dataSource: DataSource,
  ) {}

  async run(
    messageId: number,
    newSystemLabels: SystemLabel[],
    deleteTasks?: boolean,
    addLabels: SystemLabel[] = [],
    removeLabels: SystemLabel[] = [],
  ): Promise<void> {
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

      if (newSystemLabels === null) {
        newSystemLabels = [...new Set([...currentSystemLabels, ...addLabels])].filter((l) => !removeLabels.includes(l));
      }

      const addedLabels = newSystemLabels.filter((l) => !currentSystemLabels.includes(l));
      const removedLabels = currentSystemLabels.filter((l) => !newSystemLabels.includes(l));

      const toAdd = addedLabels.map((l) => labelMapping.value[l] as string);
      const toRemove = removedLabels.map((l) => labelMapping.value[l] as string);

      if (toAdd.length === 0 && toRemove.length === 0) {
        return message;
      }

      const gmail = await this.googleapisService.getGmailClient();
      await gmail.users.messages.modify({
        userId: 'me',
        id: message.gmailMessageId,
        requestBody: { addLabelIds: toAdd, removeLabelIds: toRemove },
      });

      if (removedLabels.includes(SystemLabel.ClassRegistration)) {
        await manager.delete(ClassRegistration, { messageId });
      }
      if (removedLabels.includes(SystemLabel.Inquiry)) {
        await manager.delete(Inquiry, { messageId });
      }
      if (removedLabels.includes(SystemLabel.Task) && deleteTasks) {
        await manager.delete(Task, { messageId });
      }

      await manager.update(Message, message.id, { systemLabels: newSystemLabels });
    });
  }
}
