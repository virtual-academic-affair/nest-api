import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Put,
  Delete,
} from '@nestjs/common';
import { RedisService } from '@shared/redis/redis.service';
import { Get } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type { Redis } from 'ioredis';
import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Role } from '@authentication/enums/role.enum';
import { ResourceDto } from '@email/dtos/messages/resource.dto';
import { UpdateLabelsDto } from '@email/dtos/messages/update-labels.dto';
import { Message } from '@email/entities/message.entity';
import { MessageLabelsService } from '@email/services/message-labels.service';
import { MessagesService } from '@email/services/messages.service';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { RestrictMethods } from '@shared/resource/decorators/restrict-methods.decorator';
import { ResourceAction } from '@shared/resource/enums/resource-action.enum';
import { SocketGateway } from 'src/app/socket/socket.gateway';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('email/messages')
@RestrictMethods({
  only: [ResourceAction.FindAll, ResourceAction.FindOne, ResourceAction.Delete],
})
export class MessagesController extends ResourceController<Message> {
  constructor(
    protected readonly service: MessagesService,
    private readonly messageLabelsService: MessageLabelsService,
    private readonly socketGateway: SocketGateway,
    redisService: RedisService,
  ) {
    super(service);
    this.redis = redisService.getOrThrow();
  }

  private readonly redis: Redis;

  protected getDtoClasses() {
    return ResourceDto;
  }

  @Get('processing-ids')
  async getProcessingIds() {
    const keys = await this.redis.keys('message:processing:*');
    const ids = keys
      .map((k) => {
        const parts = k.split(':');
        return parseInt(parts[parts.length - 1], 10);
      })
      .filter((id) => !isNaN(id));
    return { data: ids };
  }

  @Put(':id/labels')
  async updateLabels(@Body() data: UpdateLabelsDto, @Param('id', ParseIntPipe) messageId: number) {
    return await this.messageLabelsService.run(messageId, data.systemLabels);
  }

  @GrpcMethod('MessageService', 'UpdateLabels')
  async updateLabelsGrpc(@Body() data: UpdateLabelsDto) {
    await this.messageLabelsService.run(data.messageId, null, false, data.systemLabels);
    await this.socketGateway.emitMessageLabelsUpdated(data.messageId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.service.removeMessage(+id);
  }
}
