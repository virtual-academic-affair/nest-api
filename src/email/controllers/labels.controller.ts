import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Role } from '@authentication/enums/role.enum';
import { UpdateDto } from '@email/dtos/labels/update.dto';
import { LabelsService } from '@email/services/labels.service';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('email/labels')
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Get('gmailLabels')
  findAllGmailLabels() {
    return this.labelsService.findAllGmailLabels();
  }

  @Get()
  findAll() {
    return this.labelsService.findAll();
  }

  @Put()
  update(@Body() dto: UpdateDto) {
    return this.labelsService.update(dto);
  }

  @Post('autoCreate')
  autoCreateLabels() {
    return this.labelsService.autoCreateLabels();
  }
}
