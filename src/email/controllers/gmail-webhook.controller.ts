import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { GmailWebhookGuard } from '@email/guards/gmail-webhook.guard';
import { GmailWebhookService, PubSubPushPayload } from '@email/services/gmail/gmail-webhook.service';

@Controller('email/gmail')
export class GmailWebhookController {
  constructor(private readonly gmailWebhookService: GmailWebhookService) {}

  @Post('webhook')
  @UseGuards(GmailWebhookGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async webhook(@Body() payload: PubSubPushPayload) {
    await this.gmailWebhookService.handle(payload);
  }
}
