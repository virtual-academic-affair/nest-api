import { registerAs } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';

export default registerAs('rabbitmq', () => ({
  transport: Transport.RMQ as number,
  options: {
    urls: [process.env.RABBITMQ_URL ?? 'amqp://localhost:5672'],
    queue: process.env.RABBITMQ_QUEUE ?? '',
    queueOptions: { durable: true },
    noAck: false,
    prefetchCount: 50,
  },
}));
