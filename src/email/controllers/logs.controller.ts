import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { Auth, AuthType } from '@authentication/decorators/auth.decorator';
import { Role, Roles } from '@authentication/decorators/roles.decorator';
import { GmailLogFilesQueryDto } from '@email/dtos/logs/log-files-query.dto';
import { GmailLogQueryService } from '@email/services/gmail-log-query.service';

@Auth(AuthType.Jwt)
@Roles(Role.Admin)
@Controller('email/logs')
export class LogsController {
  constructor(private readonly gmailLogQueryService: GmailLogQueryService) {}

  @Get()
  async listFiles(@Query() query: GmailLogFilesQueryDto) {
    return await this.gmailLogQueryService.listFiles(query);
  }

  @Get(':date')
  async getFile(@Param('date') date: string) {
    return await this.gmailLogQueryService.getFile(date);
  }

  @Delete(':date')
  async deleteFile(@Param('date') date: string) {
    await this.gmailLogQueryService.deleteFile(date);
    return { success: true };
  }
}
