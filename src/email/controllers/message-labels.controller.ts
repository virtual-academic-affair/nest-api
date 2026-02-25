import { Body, Controller, Put } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Role } from '@authentication/enums/role.enum';
import { UpdateDto } from '@email/dtos/message-labels/update.dto';
import { MessageLabelsService } from '@email/services/message-labels.service';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('email/messageLabels')
export class MessageLabelsController {
  constructor(private readonly messageLabelsService: MessageLabelsService) {}

  @Put()
  @GrpcMethod('MessageLabelService', 'UpdateLabel')
  async updateLabel(@Body() data: UpdateDto) {
    return await this.messageLabelsService.run(data.messageId, data.systemLabel, data.isRemove);
  }
}
