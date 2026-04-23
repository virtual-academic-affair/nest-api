import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { Message } from '@email/entities/message.entity';
import { EmailLabel, LabelKey } from '@email/enums/email-label.enum';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
import { Setting } from '@shared/setting/entities/setting.entity';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { GmailApiService } from './gmail-api.service';

@Injectable()
export class MessageLabelsService {
  constructor(
    private readonly gmailApiService: GmailApiService,
    private readonly dataSource: DataSource,
  ) {}

  async run(
    messageId: number,
    newSystemLabels: EmailLabel[] | null,
    _deleteTasks?: boolean,
    addLabels: EmailLabel[] = [],
    removeLabels: EmailLabel[] = [],
  ): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const message = await manager.findOneOrFail(Message, {
        where: { id: messageId },
        lock: { mode: 'pessimistic_write' },
      });
      const currentSystemLabels = message.systemLabels ?? [];
      const finalSystemLabels =
        newSystemLabels === null
          ? [...new Set([...currentSystemLabels, ...addLabels])].filter((l) => !removeLabels.includes(l))
          : newSystemLabels;

      await this.applySystemLabels(manager, message, finalSystemLabels, true);
    });
  }

  async syncFromGmail(messageId: number, newSystemLabels: EmailLabel[], labelIds?: string[]): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const message = await manager.findOneOrFail(Message, {
        where: { id: messageId },
        lock: { mode: 'pessimistic_write' },
      });
      await this.applySystemLabels(manager, message, newSystemLabels, false, labelIds);
    });
  }

  async syncGmailLabels(
    gmailMessageId: string,
    addedLabels: LabelKey[],
    removedLabels: LabelKey[],
    manager?: EntityManager,
  ): Promise<void> {
    if (addedLabels.length === 0 && removedLabels.length === 0) {
      return;
    }

    manager ??= this.dataSource.manager;
    const labelMapping = await manager.findOneOrFail(Setting, {
      where: { key: SettingKey.EmailLabels },
      lock: { mode: 'pessimistic_write' },
    });

    const toAdd = addedLabels.map((l) => labelMapping.value[l] as string);
    const toRemove = removedLabels.map((l) => labelMapping.value[l] as string);

    if (toAdd.length === 0 && toRemove.length === 0) {
      return;
    }

    const gmail = await this.gmailApiService.getGmailClient();
    await gmail.users.messages.modify({
      userId: 'me',
      id: gmailMessageId,
      requestBody: { addLabelIds: toAdd, removeLabelIds: toRemove },
    });
  }

  private async applySystemLabels(
    manager: EntityManager,
    message: Message,
    newSystemLabels: EmailLabel[],
    shouldSyncToGmail: boolean,
    labelIds?: string[],
  ): Promise<void> {
    const currentSystemLabels = message.systemLabels ?? [];
    const addedLabels = newSystemLabels.filter((l) => !currentSystemLabels.includes(l));
    const removedLabels = currentSystemLabels.filter((l) => !newSystemLabels.includes(l));

    if (shouldSyncToGmail) {
      await this.syncGmailLabels(message.gmailMessageId, addedLabels, removedLabels, manager);
    }

    if (removedLabels.includes(EmailLabel.ClassRegistration)) {
      await manager.delete(ClassRegistration, { messageId: message.id });
    }
    const removedInquiryRoots = [EmailLabel.Training, EmailLabel.Graduation].filter((label) =>
      removedLabels.includes(label),
    );
    if (
      removedInquiryRoots.length > 0 &&
      !newSystemLabels.some((label) => [EmailLabel.Training, EmailLabel.Graduation].includes(label))
    ) {
      await manager.delete(Inquiry, { messageId: message.id });
    }

    await manager.update(Message, message.id, {
      systemLabels: newSystemLabels,
      ...(labelIds !== undefined ? { labelIds } : {}),
    });
  }
}
