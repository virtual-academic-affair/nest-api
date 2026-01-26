import { Body, Controller, Param, ParseIntPipe, Put } from '@nestjs/common';
import { Auth } from '@authentication/decorators/auth.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Roles } from '@authentication/decorators/roles.decorator';
import { Role } from '@authentication/enums/role.enum';
import { MessageLabelsService } from '../services/message-labels.service';
import { UpdateMessageLabelDto } from '../dto/message-labels/update.dto';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('email/messages/:id/labels')
export class MessageLabelsController {
  constructor(private readonly messageLabelsService: MessageLabelsService) {}

  @Put()
  async updateLabel(
    @Param('id', ParseIntPipe) messageId: number,
    @Body() dto: UpdateMessageLabelDto
  ) {
    return await this.messageLabelsService.updateLabel(
      messageId,
      dto.systemLabel,
      dto.isRemove
    );
  }
}
