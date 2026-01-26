import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { RabbitMQService } from '@shared/services/rabbitmq.service';
import {
  EmailRoutingKey,
  QUEUE_NLP_LABELED,
} from '@shared/enums/rabbitmq.enum';
import { Email } from '../../entities/email.entity';
import { SettingService } from '@shared/setting/services/setting.service';
import { GoogleapisService } from '../../services/googleapis.service';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { NlpLabeledDto } from '../../dto/nlp/nlp-labeled.dto';
import { validateDto } from '@shared/resource/utils/validate-dto.util';
import { UpdateDto } from '../../dto/labels/update.dto';

@Injectable()
export class NlpLabeledConsumer implements OnApplicationBootstrap {
  constructor(
    private readonly rabbitmqService: RabbitMQService,
    private readonly settingService: SettingService,
    private readonly googleapisService: GoogleapisService,
    @InjectRepository(Email)
    private readonly emailRepository: Repository<Email>
  ) {}

  async onApplicationBootstrap() {
    await this.rabbitmqService.subscribe(
      QUEUE_NLP_LABELED,
      EmailRoutingKey.NlpLabeled,
      async (data: unknown) => {
        const payload = await validateDto(NlpLabeledDto, data);
        await this.handleMessage(payload);
      }
    );
  }

  private async handleMessage(payload: NlpLabeledDto): Promise<void> {
    const { gmailMessageId, id: emailId } = payload.internal;
    const systemLabels = payload.labels;

    const email = await this.emailRepository.findOne({
      where: [{ gmailMessageId, systemLabels: IsNull(), id: emailId }],
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
