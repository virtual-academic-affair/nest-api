import { Body, Controller, Post, Query } from '@nestjs/common';
import { Auth, AuthType } from '@authentication/decorators/auth.decorator';
import { Role, Roles } from '@authentication/decorators/roles.decorator';
import { ReplyPluckDto } from '@email/dtos/messages/reply-pluck.dto';
import { ResourceDto } from '@email/dtos/messages/resource.dto';
import { Message } from '@email/entities/message.entity';
import { MessagesService } from '@email/services/messages.service';
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

  @Post('reply-pluck')
  async replyPluck(@Query() query: ReplyPluckDto, @Body() body: ReplyPluckDto) {
    return await this.service.replyPluck({ ...query, ...body });
  }
}
