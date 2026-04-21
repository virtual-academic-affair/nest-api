import { Logger } from '@nestjs/common';
import { RedisService } from '@shared/redis/redis.service';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Redis } from 'ioredis';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(redisService: RedisService) {
    this.redis = redisService.getOrThrow();
  }

  private readonly logger = new Logger(SocketGateway.name);
  private readonly redis: Redis;

  private getMessageProcessingKey(messageId: number | string): string {
    return `message:processing:${messageId}`;
  }

  @WebSocketServer()
  server: Server;

  afterInit(_server: Server) {
    this.logger.log('Socket initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  async emitMessageIngested(messageIds: number[]) {
    if (!messageIds.length) {
      return;
    }

    await Promise.all(
      messageIds.map((id) => this.redis.set(this.getMessageProcessingKey(id), '1', 'EX', 24 * 60 * 60)),
    );
    this.server.emit('email.ingested', { count: messageIds.length });
  }

  async emitMessageLabelsUpdated(messageId: number) {
    await this.redis.del(this.getMessageProcessingKey(messageId));
    this.server.emit('message.labels.updated', { messageId });
  }
}
