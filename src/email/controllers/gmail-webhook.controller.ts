import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Auth } from '@authentication/decorators/auth.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { GmailWebhookService } from '@email/services/gmail/gmail-webhook.service';

@Controller('email/gmail')
export class GmailWebhookController {
  constructor(private readonly gmailWebhookService: GmailWebhookService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.NO_CONTENT)
  async webhook(@Body() payload: { message?: { data?: string } }) {
    await this.gmailWebhookService.handleWebhook(payload);
  }
}
