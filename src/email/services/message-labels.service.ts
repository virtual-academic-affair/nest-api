import { UpdateDto } from '@email/dtos/labels/update.dto';
import { Message } from '@email/entities/message.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SystemLabel } from '@shared/enums/system-label.enum';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';
import { Repository } from 'typeorm';
import { GoogleapisService } from './googleapis.service';

@Injectable()
export class MessageLabelsService {
  constructor(
    private readonly googleapisService: GoogleapisService,
    private readonly settingService: SettingService,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>
  ) {}

  async run(
    messageId: number,
    systemLabel: SystemLabel,
    isRemove: boolean
  ): Promise<Message> {
    const message = await this.messageRepository.findOneByOrFail({
      id: messageId,
    });
    const currentSystemLabels = message.systemLabels ?? [];
    const hasLabel = currentSystemLabels.includes(systemLabel);

    throwUnless(
      hasLabel === isRemove,
      new BadRequestException(
        `Label ${systemLabel} ${isRemove ? 'does not exist' : 'already exists'}`
      )
    );

    const gmailLabelId = (
      await this.settingService.get<UpdateDto>(SettingKey.EmailLabels)
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
      id: message.gmailMessageId,
      requestBody: {
        addLabelIds: isRemove ? [] : [gmailLabelId],
        removeLabelIds: isRemove ? [gmailLabelId] : [],
      },
    });

    const newSystemLabels = isRemove
      ? currentSystemLabels.filter((label) => label !== systemLabel)
      : [...currentSystemLabels, systemLabel];

    await this.messageRepository.update(message.id, {
      systemLabels: newSystemLabels,
    });

    return await this.messageRepository.findOneByOrFail({ id: message.id });
  }
}
