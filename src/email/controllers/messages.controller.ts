import {
  Body,
  Controller,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Delete,
  Query,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { Get } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Role } from '@authentication/enums/role.enum';
import { QueryDto } from '@email/dtos/messages/query.dto';
import { UpdateLabelsDto } from '@email/dtos/messages/update-labels.dto';
import { Message } from '@email/entities/message.entity';
import { EmailSyncService } from '@email/services/email-send/email-sync.service';
import { MessageLabelsService } from '@email/services/message-labels.service';
import { MessagesService } from '@email/services/messages.service';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { RestrictMethods } from '@shared/resource/decorators/restrict-methods.decorator';
import { ResourceAction } from '@shared/resource/enums/resource-action.enum';
import { RedisService } from '@shared/services/redis.service';
import { SocketGateway } from 'src/socket/socket.gateway';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('email/messages')
@RestrictMethods({
  only: [ResourceAction.FindAll, ResourceAction.FindOne, ResourceAction.Delete],
})
export class MessagesController extends ResourceController<Message> {
  constructor(
    protected readonly service: MessagesService,
    private readonly emailSyncService: EmailSyncService,
    private readonly messageLabelsService: MessageLabelsService,
    private readonly socketGateway: SocketGateway,
    private readonly redisService: RedisService,
  ) {
    super(service);
  }

  protected getDtoClasses() {
    return { query: QueryDto };
  }

  @Get('processing-ids')
  async getProcessingIds() {
    const keys = await this.redisService.keys('message:processing:*');
    const ids = keys
      .map((k) => {
        const parts = k.split(':');
        return parseInt(parts[parts.length - 1], 10);
      })
      .filter((id) => !isNaN(id));
    return { data: ids };
  }

  @Post('sync')
  protected async sync() {
    return await this.emailSyncService.run();
  }

  @Put(':id/labels')
  async updateLabels(@Body() data: UpdateLabelsDto, @Param('id', ParseIntPipe) messageId: number) {
    return await this.messageLabelsService.run(messageId, data.systemLabels, data.deleteTasks);
  }

  @GrpcMethod('MessageService', 'UpdateLabels')
  async updateLabelsGrpc(@Body() data: UpdateLabelsDto) {
    await this.messageLabelsService.run(data.messageId, null, false, data.systemLabels);
    await this.socketGateway.emitMessageLabelsUpdated(data.messageId);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Query('deleteTasks', new DefaultValuePipe(false), ParseBoolPipe) deleteTasks?: boolean,
  ) {
    return await this.service.removeMessage(+id, deleteTasks);
  }
}
