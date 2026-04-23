import { Controller, Get, Post } from '@nestjs/common';
import { Auth, AuthType } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { Role } from '@authentication/enums/role.enum';
import { LabelsService } from '@email/services/labels.service';

@Auth(AuthType.Jwt)
@Roles(Role.Admin)
@Controller('email/labels')
export class LabelsController {
  constructor(private readonly labelsService: LabelsService) {}

  @Get('gmailLabels')
  findAllGmailLabels() {
    return this.labelsService.findAllGmailLabels();
  }

  @Post('autoCreate')
  autoCreateLabels() {
    return this.labelsService.autoCreateLabels();
  }
}
