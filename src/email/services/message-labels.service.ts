import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Email } from '@email/entities/email.entity';
import { GoogleapisService } from './googleapis.service';
import { SettingService } from '@shared/setting/services/setting.service';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { UpdateDto } from '@email/dto/labels/update.dto';
import { SystemLabel } from '@shared/enums/system-label.enum';
import { throwIf, throwUnless } from '@shared/utils/throw.util';
import { MessagesService } from '@email/services/messages.service';

@Injectable()
export class MessageLabelsService {
  constructor(
    @InjectRepository(Email)
    private readonly messageService: MessagesService,
    private readonly googleapisService: GoogleapisService,
    private readonly settingService: SettingService
  ) {}

  async updateLabel(
    messageId: number,
    systemLabel: SystemLabel,
    isRemove: boolean
  ): Promise<Email> {
    const email = await this.messageService.findOne(messageId);
    const currentSystemLabels = email.systemLabels ?? [];
    const hasLabel = currentSystemLabels.includes(systemLabel);

    throwIf(
      hasLabel === isRemove,
      new BadRequestException(
        `Label ${systemLabel} ${isRemove ? 'does not exist' : 'already exists'}`
      )
    );

    const gmailLabelId = await this.settingService.get<UpdateDto>(
      SettingKey.EmailLabels
    )[systemLabel];

    throwUnless(
      gmailLabelId,
      new BadRequestException(
        `Gmail label mapping not found for ${systemLabel}`
      )
    );

    const gmail = await this.googleapisService.getGmailClient();
    await gmail.users.messages.modify({
      userId: 'me',
      id: email.gmailMessageId,
      requestBody: {
        addLabelIds: isRemove ? [] : [gmailLabelId],
        removeLabelIds: isRemove ? [gmailLabelId] : [],
      },
    });

    const newSystemLabels = isRemove
      ? currentSystemLabels.filter((label) => label !== systemLabel)
      : [...currentSystemLabels, systemLabel];

    await this.messageService.update(email.id, {
      systemLabels: newSystemLabels,
    });

    return await this.messageService.findOne(messageId);
  }
}
