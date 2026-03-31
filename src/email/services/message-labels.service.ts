import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { Message } from '@email/entities/message.entity';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
import { InquiryType } from '@inquiry/enums/inquiry-type.enum';
import { SystemLabel } from '@shared/enums/system-label.enum';
import { Setting } from '@shared/setting/entities/setting.entity';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { Task } from '@task/entities/task.entity';
import { GoogleapisService } from './googleapis.service';
import { LabelsService } from './labels.service';

@Injectable()
export class MessageLabelsService {
  constructor(
    private readonly googleapisService: GoogleapisService,
    private readonly labelsService: LabelsService,
    private readonly dataSource: DataSource,
  ) {}

  async run(
    messageId: number,
    newSystemLabels: SystemLabel[],
    deleteTasks?: boolean,
    addLabels: SystemLabel[] = [],
    removeLabels: SystemLabel[] = [],
    newInquiryTypes?: InquiryType[],
    oldInquiryTypes: InquiryType[] = [],
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

      const addedLabels = newSystemLabels?.filter((l) => !currentSystemLabels.includes(l)) ?? [];
      const removedLabels = newSystemLabels ? currentSystemLabels.filter((l) => !newSystemLabels.includes(l)) : [];
      const inquiry = removedLabels.includes(SystemLabel.Inquiry)
        ? await manager.findOne(Inquiry, { where: { messageId } })
        : null;
      const inquiryTypes = inquiry?.types ?? [];

      const toAdd = addedLabels.map((l) => labelMapping.value[l] as string);
      const toRemove = removedLabels.map((l) => labelMapping.value[l] as string);

      if (newInquiryTypes !== undefined) {
        const inquiryTypeMapping = await this.labelsService.autoCreateInquiryTypeLabels();
        const addedInquiryTypes = newInquiryTypes.filter((type) => !oldInquiryTypes.includes(type));
        const removedInquiryTypes = oldInquiryTypes.filter((type) => !newInquiryTypes.includes(type));

        toAdd.push(...addedInquiryTypes.map((type) => inquiryTypeMapping[type]).filter(Boolean));
        toRemove.push(...removedInquiryTypes.map((type) => inquiryTypeMapping[type]).filter(Boolean));
      }

      if (inquiryTypes.length) {
        const inquiryTypeMapping = await this.labelsService.autoCreateInquiryTypeLabels();
        const inquiryTypeLabelIds = inquiryTypes.map((type: InquiryType) => inquiryTypeMapping[type]).filter(Boolean);
        toRemove.push(...inquiryTypeLabelIds);
      }

      if (toAdd.length === 0 && toRemove.length === 0) {
        return message;
      }

      const gmail = await this.googleapisService.getGmailClient();
      const { data } = await gmail.users.messages.modify({
        userId: 'me',
        id: message.gmailMessageId,
        requestBody: {
          addLabelIds: [...new Set(toAdd)],
          removeLabelIds: [...new Set(toRemove)],
        },
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

      await manager.update(Message, message.id, {
        systemLabels: newSystemLabels ?? message.systemLabels,
        labelIds: data.labelIds ?? message.labelIds,
      });
    });
  }
}
