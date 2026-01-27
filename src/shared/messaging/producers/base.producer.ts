import { Injectable } from '@nestjs/common';
import { RabbitMQService } from '@shared/services/rabbitmq.service';

@Injectable()
export abstract class BaseProducer<TPayload = any> {
  /**
   * The routing key to use when publishing messages.
   * Must be defined by subclasses.
   */
  protected abstract readonly routingKey: string;

  protected constructor(protected readonly rabbitmqService: RabbitMQService) {}

  /**
   * Publishes a message to RabbitMQ using the defined routing key.
   *
   * @param payload - The message payload to publish
   * @returns Promise that resolves when message is published
   */
  protected async publish(payload: TPayload): Promise<void> {
    await this.rabbitmqService.publish(this.routingKey, payload);
  }
}
