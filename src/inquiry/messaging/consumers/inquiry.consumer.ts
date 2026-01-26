import { Injectable } from '@nestjs/common';
import { BaseConsumer } from '@shared/messaging/consumers/base.consumer';
import { RabbitMQService } from '@shared/services/rabbitmq.service';
import { EmailRoutingKey, QUEUE_INQUIRY } from '@shared/enums/rabbitmq.enum';
import { InquiryDto } from '@inquiry/dtos/messaging/inquiry.dto';

@Injectable()
export class InquiryConsumer extends BaseConsumer<InquiryDto> {
  protected readonly queueName = QUEUE_INQUIRY;

  protected readonly routingKey = EmailRoutingKey.Inquiry;

  protected readonly payloadDtoClass = InquiryDto;

  constructor(rabbitmqService: RabbitMQService) {
    super(rabbitmqService);
  }

  protected async handleMessage(payload: InquiryDto): Promise<void> {
    this.logger.log('Received inquiry email', {
      emailId: payload.internal.id,
      gmailMessageId: payload.internal.gmailMessageId,
    });

    // TODO:
  }
}
