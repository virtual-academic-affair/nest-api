import { Body, Controller, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Role } from '@authentication/enums/role.enum';
import { QueryDto } from '@email/dtos/messages/query.dto';
import { Message } from '@email/entities/message.entity';
import { EmailSyncService } from '@email/services/email-send/email-sync.service';
import { MessageLabelsService } from '@email/services/message-labels.service';
import { MessagesService } from '@email/services/messages.service';
import { SystemLabel } from '@shared/enums/system-label.enum';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { RestrictMethods } from '@shared/resource/decorators/restrict-methods.decorator';
import { ResourceAction } from '@shared/resource/enums/resource-action.enum';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('email/messages')
@RestrictMethods({
  only: [ResourceAction.FindAll, ResourceAction.FindOne],
})
export class MessagesController extends ResourceController<Message> {
  constructor(
    protected readonly service: MessagesService,
    private readonly emailSyncService: EmailSyncService,
    private readonly messageLabelsService: MessageLabelsService,
  ) {
    super(service);
  }

  protected getDtoClasses() {
    return { query: QueryDto };
  }

  @Post('sync')
  protected async sync() {
    return await this.emailSyncService.run();
  }

  @Put(':id/labels')
  async updateLabel(
    @Body() data: { messageId: number; systemLabels: SystemLabel[] },
    @Param('id', ParseIntPipe) messageId?: number,
  ) {
    return await this.messageLabelsService.run(messageId || data.messageId, data.systemLabels);
  }
}
