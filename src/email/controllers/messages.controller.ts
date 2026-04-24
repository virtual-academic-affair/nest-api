import { Body, Controller, Delete, Param, ParseIntPipe, Put } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Auth, AuthType } from '@authentication/decorators/auth.decorator';
import { Role, Roles } from '@authentication/decorators/roles.decorator';
import { ResourceDto } from '@email/dtos/messages/resource.dto';
import { UpdateLabelsDto } from '@email/dtos/messages/update-labels.dto';
import { Message } from '@email/entities/message.entity';
import { MessageLabelsService } from '@email/services/message-labels.service';
import { MessagesService } from '@email/services/messages.service';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { RestrictMethods } from '@shared/resource/decorators/restrict-methods.decorator';
import { ResourceAction } from '@shared/resource/enums/resource-action.enum';

@Auth(AuthType.Jwt)
@Roles(Role.Admin)
@Controller('email/messages')
@RestrictMethods({
  only: [ResourceAction.FindOne, ResourceAction.Delete],
})
export class MessagesController extends ResourceController<Message> {
  constructor(
    protected readonly service: MessagesService,
    private readonly messageLabelsService: MessageLabelsService,
  ) {
    super(service);
  }

  protected getDtoClasses() {
    return ResourceDto;
  }

  @Put(':id/labels')
  async updateLabels(@Body() data: UpdateLabelsDto, @Param('id', ParseIntPipe) messageId: number) {
    return await this.messageLabelsService.run(messageId, data.systemLabels);
  }

  @GrpcMethod('MessageService', 'UpdateLabels')
  async updateLabelsGrpc(@Body() data: UpdateLabelsDto) {
    await this.messageLabelsService.run(data.messageId, null, false, data.systemLabels);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.service.removeMessage(+id);
  }
}
