import { Body, Controller, Param, Post } from '@nestjs/common';
import { RabbitMQService } from '@shared/services/rabbitmq.service';

@Controller('rabbitmq')
export class RabbitMQController {
  constructor(private readonly rabbitmqService: RabbitMQService) {}

  @Post(':routingKey')
  async publishMessage(
    @Param('routingKey') routingKey: string,
    @Body() body: any
  ) {
    return this.rabbitmqService.publish(routingKey, body);
  }
}
