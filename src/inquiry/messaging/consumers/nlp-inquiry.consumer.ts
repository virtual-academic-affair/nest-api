import { Injectable } from '@nestjs/common';
import { BaseConsumer } from '@shared/messaging/consumers/base.consumer';
import { RabbitMQService } from '@shared/services/rabbitmq.service';
import { EmailRoutingKey, QUEUE_INQUIRY } from '@shared/enums/rabbitmq.enum';
import { NlpProcessedDto } from '@email/dtos/nlp/nlp-processed.dto';

@Injectable()
export class NlpInquiryConsumer extends BaseConsumer<NlpProcessedDto> {
  protected readonly queueName = QUEUE_INQUIRY;

  protected readonly routingKey = EmailRoutingKey.Inquiry;

  protected readonly payloadDtoClass = NlpProcessedDto;

  constructor(rabbitmqService: RabbitMQService) {
    super(rabbitmqService);
  }

  protected async handleMessage(payload: NlpProcessedDto): Promise<void> {
    this.logger.log('Received inquiry email', {
      emailId: payload.internal.id,
      gmailMessageId: payload.internal.gmailMessageId,
      systemLabel: payload.systemLabel,
      businessData: payload.businessData,
    });

    // TODO: Implement business logic for inquiries
  }
}
