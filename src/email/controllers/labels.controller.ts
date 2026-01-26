import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { Auth } from '@authentication/decorators/auth.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Roles } from '@authentication/decorators/roles.decorator';
import { Role } from '@authentication/enums/role.enum';
import { LabelsService } from '../services/labels.service';
import { UpdateDto } from '@email/dtos/labels/update.dto';

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
