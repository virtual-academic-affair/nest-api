import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { GmailWebhookGuard } from '@email/guards/gmail-webhook.guard';
import { GmailWebhookHandlerService } from '@email/services/gmail-webhook-handler.service';
import { PubSubPushPayload } from '@email/services/gmail/gmail-webhook.service';

@Controller('email/gmail')
export class GmailWebhookController {
  constructor(private readonly gmailWebhookHandlerService: GmailWebhookHandlerService) {}

  @Post('webhook')
  @UseGuards(GmailWebhookGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async webhook(@Body() payload: PubSubPushPayload) {
    await this.gmailWebhookHandlerService.handle(payload);
  }
}
