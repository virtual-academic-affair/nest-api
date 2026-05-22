import { ActiveUser } from '@authentication/decorators/active-user.decorator';
import { Auth, AuthType } from '@authentication/decorators/auth.decorator';
import { Role, Roles } from '@authentication/decorators/roles.decorator';
import { ReplyPluckDto } from '@email/dtos/messages/reply-pluck.dto';
import { ResourceDto } from '@email/dtos/messages/resource.dto';
import { Message } from '@email/entities/message.entity';
import { MessagesService } from '@email/services/messages.service';
import { Body, Controller, Delete, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { RestrictMethods } from '@shared/resource/decorators/restrict-methods.decorator';
import { ResourceAction } from '@shared/resource/enums/resource-action.enum';

@Auth(AuthType.Jwt)
@Roles(Role.Admin)
@Controller('email/messages')
@RestrictMethods({ only: [ResourceAction.FindAll, ResourceAction.FindOne, ResourceAction.Delete] })
export class MessagesController extends ResourceController<Message> {
  constructor(protected readonly service: MessagesService) {
    super(service);
  }

  protected getDtoClasses() {
    return ResourceDto;
  }

  @Auth(AuthType.Grpc)
  @GrpcMethod('MessageService', 'GetState')
  getStateGrpc(@Payload() dto: { messageId: number }) {
    return this.service.getState(dto.messageId);
  }

  @Post('reply-pluck')
  async replyPluck(
    @Query() query: ReplyPluckDto,
    @Body() body: ReplyPluckDto,
    @ActiveUser('email') actorEmail: string,
  ) {
    return await this.service.replyPluck({ ...query, ...body }, actorEmail);
  }

  @Delete(':id')
  override async remove(@Param('id') id: string, @ActiveUser('email') actorEmail?: string) {
    return await this.service.remove(+id, actorEmail);
  }
}
