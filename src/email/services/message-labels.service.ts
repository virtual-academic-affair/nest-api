import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { Message } from '@email/entities/message.entity';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
import { InquiryType } from '@inquiry/enums/inquiry-type.enum';
import { LabelKey, SystemLabel } from '@shared/enums/system-label.enum';
import { Setting } from '@shared/setting/entities/setting.entity';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';
import { Task } from '@task/entities/task.entity';
import { GoogleapisService } from './googleapis.service';

@Injectable()
export class MessageLabelsService {
  constructor(
    private readonly googleapisService: GoogleapisService,
    private readonly dataSource: DataSource,
    private readonly settingService: SettingService,
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
      const currentSystemLabels = message.systemLabels ?? [];
      if (newSystemLabels === null) {
        newSystemLabels = [...new Set([...currentSystemLabels, ...addLabels])].filter((l) => !removeLabels.includes(l));
      }

      const addedLabels = newSystemLabels.filter((l) => !currentSystemLabels.includes(l));
      const removedLabels = currentSystemLabels.filter((l) => !newSystemLabels.includes(l));
      await this.syncGmailLabels(message.gmailMessageId, addedLabels, removedLabels, manager);

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

    const gmail = await this.googleapisService.getGmailClient();
    await gmail.users.messages.modify({
      userId: 'me',
      id: gmailMessageId,
      requestBody: { addLabelIds: toAdd, removeLabelIds: toRemove },
    });
  }

  async syncFromGmail(
    addedEvents: { gmailMessageId: string; labelIds: string[] }[],
    removedEvents: { gmailMessageId: string; labelIds: string[] }[],
  ): Promise<void> {
    const labelMapping = (await this.settingService.get<Record<string, string | null>>(SettingKey.EmailLabels)) ?? {};
    const labelKeyById = Object.fromEntries(
      Object.entries(labelMapping)
        .filter(([, labelId]) => typeof labelId === 'string' && !!labelId)
        .map(([labelKey, labelId]) => [labelId, labelKey]),
    );
    const inquiryTypes = new Set(Object.values(InquiryType));
    const systemLabels = new Set(Object.values(SystemLabel));
    const eventsByMessageId = new Map<string, { added: Set<string>; removed: Set<string> }>();
    const init = (id: string) => {
      if (!eventsByMessageId.has(id)) {
        eventsByMessageId.set(id, { added: new Set<string>(), removed: new Set<string>() });
      }
      return eventsByMessageId.get(id)!;
    };

    addedEvents.forEach((event) =>
      event.labelIds.forEach((labelId) => labelId && init(event.gmailMessageId).added.add(labelId)),
    );
    removedEvents.forEach((event) =>
      event.labelIds.forEach((labelId) => labelId && init(event.gmailMessageId).removed.add(labelId)),
    );

    await this.dataSource.transaction(async (manager) => {
      for (const [gmailMessageId, changes] of eventsByMessageId.entries()) {
        const message = await manager.findOne(Message, {
          where: { gmailMessageId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!message) {
          continue;
        }

        const addedKeys = [...changes.added]
          .map((labelId) => labelKeyById[labelId])
          .filter((labelKey): labelKey is LabelKey => !!labelKey);
        const removedKeys = [...changes.removed]
          .map((labelId) => labelKeyById[labelId])
          .filter((labelKey): labelKey is LabelKey => !!labelKey);
        const nextLabelIds = new Set(message.labelIds ?? []);
        for (const labelId of changes.added) {
          nextLabelIds.add(labelId);
        }
        for (const labelId of changes.removed) {
          nextLabelIds.delete(labelId);
        }
        const nextSystemLabels = new Set(message.systemLabels ?? []);
        for (const key of addedKeys) {
          if (systemLabels.has(key as SystemLabel)) {
            nextSystemLabels.add(key as SystemLabel);
          }
        }

        if (removedKeys.includes(SystemLabel.ClassRegistration)) {
          await manager.delete(ClassRegistration, { messageId: message.id });
        }

        if (removedKeys.includes(SystemLabel.Inquiry)) {
          const inquiryTypeKeys = Object.values(InquiryType) as LabelKey[];
          const inquiryTypeLabelIds = inquiryTypeKeys
            .map((type) => labelMapping[type] as string | undefined)
            .filter((labelId): labelId is string => !!labelId);

          if (inquiryTypeKeys.length) {
            await this.syncGmailLabels(message.gmailMessageId, [], inquiryTypeKeys, manager);
          }

          for (const labelId of inquiryTypeLabelIds) {
            nextLabelIds.delete(labelId);
          }

          await manager.delete(Inquiry, { messageId: message.id });
        }

        for (const key of removedKeys) {
          if (systemLabels.has(key as SystemLabel)) {
            nextSystemLabels.delete(key as SystemLabel);
          }
        }

        const addedInquiryTypes = addedKeys.filter((labelKey): labelKey is InquiryType =>
          inquiryTypes.has(labelKey as InquiryType),
        );
        const removedInquiryTypes = removedKeys.filter((labelKey): labelKey is InquiryType =>
          inquiryTypes.has(labelKey as InquiryType),
        );
        if (
          !removedKeys.includes(SystemLabel.Inquiry) &&
          (addedInquiryTypes.length || addedKeys.includes(SystemLabel.Inquiry))
        ) {
          nextSystemLabels.add(SystemLabel.Inquiry);
        }

        if (!removedKeys.includes(SystemLabel.Inquiry) && (addedInquiryTypes.length || removedInquiryTypes.length)) {
          const inquiry = await manager.findOne(Inquiry, {
            where: { messageId: message.id },
            lock: { mode: 'pessimistic_write' },
          });
          if (inquiry) {
            inquiry.types = [...new Set([...(inquiry.types ?? []), ...addedInquiryTypes])].filter(
              (type) => !removedInquiryTypes.includes(type),
            );
            await manager.save(Inquiry, inquiry);
          }
        }

        message.labelIds = [...nextLabelIds];
        message.systemLabels = [...nextSystemLabels];
        await manager.save(Message, message);
      }
    });
  }
}
