import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { RabbitMQService } from '@shared/services/rabbitmq.service';
import { EmailRoutingKey, QUEUE_LABELED } from '@shared/enums/rabbitmq.enum';
import { Email } from '../../entities/email.entity';
import { SettingService } from '@shared/setting/services/setting.service';
import { GoogleapisService } from '../../services/googleapis.service';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { NlpLabeledDto } from '@email/dtos/nlp/nlp-labeled.dto';
import { UpdateDto } from '@email/dtos/labels/update.dto';
import { BaseConsumer } from '@shared/messaging/consumers/base.consumer';

@Injectable()
export class NlpLabeledConsumer extends BaseConsumer<NlpLabeledDto> {
  protected readonly queueName = QUEUE_LABELED;

  protected readonly routingKey = EmailRoutingKey.Labeled;

  protected readonly payloadDtoClass = NlpLabeledDto;

  constructor(
    rabbitmqService: RabbitMQService,
    private readonly settingService: SettingService,
    private readonly googleapisService: GoogleapisService,
    @InjectRepository(Email)
    private readonly emailRepository: Repository<Email>
  ) {
    super(rabbitmqService);
  }

  protected async handleMessage(payload: NlpLabeledDto): Promise<void> {
    const { gmailMessageId, id: emailId } = payload.internal;
    const systemLabels = payload.labels;

    const email = await this.emailRepository.findOneBy({
      gmailMessageId,
      systemLabels: IsNull(),
      id: emailId,
    });

    if (!email) {
      return;
    }

    await this.emailRepository.update(email.id, { systemLabels });

    const gmailLabels = await this.settingService.get<UpdateDto>(
      SettingKey.EmailLabels
    );

    const gmailLabelIds = systemLabels
      .map((label) => gmailLabels[label])
      .filter((id): id is string => Boolean(id));

    await this.syncGmailLabels(gmailMessageId, gmailLabelIds);
  }

  private async syncGmailLabels(
    gmailMessageId: string,
    gmailLabelIds: string[]
  ): Promise<void> {
    if (!gmailLabelIds.length) {
      return;
    }

    const gmail = await this.googleapisService.getGmailClient();
    await gmail.users.messages.modify({
      userId: 'me',
      id: gmailMessageId,
      requestBody: {
        addLabelIds: gmailLabelIds,
        removeLabelIds: [],
      },
    });
  }
}
