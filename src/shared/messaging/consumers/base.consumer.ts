import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { RabbitMQService } from '@shared/services/rabbitmq.service';
import { validateDto } from '@shared/resource/utils/validate-dto.util';

@Injectable()
export abstract class BaseConsumer<TPayload = any>
  implements OnApplicationBootstrap
{
  protected readonly logger: Logger;

  /**
   * The queue name to consume messages from.
   * Must be defined by subclasses.
   */
  protected abstract readonly queueName: string;

  /**
   * The routing key to bind the queue to.
   * Must be defined by subclasses.
   */
  protected abstract readonly routingKey: string;

  /**
   * Optional DTO class for payload validation.
   * If provided, incoming messages will be validated against this class.
   */
  protected readonly payloadDtoClass?: new () => TPayload;

  protected constructor(protected readonly rabbitmqService: RabbitMQService) {
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Subscribes to the queue on application startup.
   * Automatically called by NestJS lifecycle.
   */
  async onApplicationBootstrap(): Promise<void> {
    await this.rabbitmqService.subscribe(
      this.queueName,
      this.routingKey,
      async (data: unknown) => {
        const payload = await this.validatePayload(data);
        await this.handleMessage(payload);
      }
    );

    this.logger.log(
      `Subscribed to queue "${this.queueName}" with routing key "${this.routingKey}"`
    );
  }

  /**
   * Validates the incoming payload using the payloadDtoClass if defined.
   *
   * @param data - Raw data from RabbitMQ
   * @returns Validated payload
   */
  private async validatePayload(data: unknown): Promise<TPayload> {
    if (this.payloadDtoClass) {
      return await validateDto(this.payloadDtoClass, data);
    }
    return data as TPayload;
  }

  /**
   * Handles the incoming message.
   * Must be implemented by subclasses.
   *
   * @param payload - The validated message payload
   */
  protected abstract handleMessage(payload: TPayload): Promise<void>;
}
