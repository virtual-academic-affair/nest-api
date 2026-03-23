import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RedisService } from '@shared/services/redis.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly redisService: RedisService) {}

  private readonly logger = new Logger(SocketGateway.name);

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
      messageIds.map((id) => this.redisService.set(this.getMessageProcessingKey(id), '1', 24 * 60 * 60)),
    );
    this.server.emit('email.ingested', { count: messageIds.length });
  }

  async emitMessageLabelsUpdated(messageId: number) {
    await this.redisService.del(this.getMessageProcessingKey(messageId));
    this.server.emit('message.labels.updated', { messageId });
  }
}
