import { Injectable } from '@nestjs/common';
import { BaseConsumer } from '@shared/messaging/consumers/base.consumer';
import { RabbitMQService } from '@shared/services/rabbitmq.service';
import {
  EmailRoutingKey,
  QUEUE_CLASS_REGISTRATION,
} from '@shared/enums/rabbitmq.enum';
import { NlpProcessedDto } from '@email/dtos/nlp/nlp-processed.dto';

@Injectable()
export class NlpClassRegistrationConsumer extends BaseConsumer<NlpProcessedDto> {
  protected readonly queueName = QUEUE_CLASS_REGISTRATION;

  protected readonly routingKey = EmailRoutingKey.ClassRegistration;

  protected readonly payloadDtoClass = NlpProcessedDto;

  constructor(rabbitmqService: RabbitMQService) {
    super(rabbitmqService);
  }

  protected async handleMessage(payload: NlpProcessedDto): Promise<void> {
    this.logger.log('Received class registration email', {
      emailId: payload.internal.id,
      gmailMessageId: payload.internal.gmailMessageId,
      systemLabel: payload.systemLabel,
      businessData: payload.businessData,
    });
  }
}
