import { Injectable } from '@nestjs/common';
import { BaseConsumer } from '@shared/messaging/consumers/base.consumer';
import { RabbitMQService } from '@shared/services/rabbitmq.service';
import {
  EmailRoutingKey,
  QUEUE_CLASS_REGISTRATION,
} from '@shared/enums/rabbitmq.enum';
import { ClassRegistrationDto } from '@class-registration/dtos/messaging/class-registraion.dto';

@Injectable()
export class ClassRegistrationConsumer extends BaseConsumer<ClassRegistrationDto> {
  protected readonly queueName = QUEUE_CLASS_REGISTRATION;

  protected readonly routingKey = EmailRoutingKey.ClassRegistration;

  protected readonly payloadDtoClass = ClassRegistrationDto;

  constructor(rabbitmqService: RabbitMQService) {
    super(rabbitmqService);
  }

  protected async handleMessage(payload: ClassRegistrationDto): Promise<void> {
    this.logger.log('Received class registration email', {
      emailId: payload.internal.id,
      gmailMessageId: payload.internal.gmailMessageId,
    });

    // TODO:
  }
}
