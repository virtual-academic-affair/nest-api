import { Injectable } from '@nestjs/common';
import { BaseConsumer } from '@shared/messaging/consumers/base.consumer';
import { RabbitMQService } from '@shared/services/rabbitmq.service';
import { RoutingKey, QueueName } from '@shared/enums/rabbitmq.enum';
import { TaskDto } from '@task/dtos/messaging/task.dto';

@Injectable()
export class TaskConsumer extends BaseConsumer<TaskDto> {
  protected readonly queueName = QueueName.Task;

  protected readonly routingKey = RoutingKey.Task;

  protected readonly payloadDtoClass = TaskDto;

  constructor(rabbitmqService: RabbitMQService) {
    super(rabbitmqService);
  }

  protected async handleMessage(payload: TaskDto): Promise<void> {
    this.logger.log('Received task email', {
      emailId: payload.internal.id,
      gmailMessageId: payload.internal.gmailMessageId,
    });

    // TODO:
  }
}
