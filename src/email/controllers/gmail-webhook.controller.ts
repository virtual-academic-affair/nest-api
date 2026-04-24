import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { GmailWebhookGuard } from '@email/guards/gmail-webhook.guard';
import { PubSubPushPayload } from '@email/services/gmail/gmail-webhook.service';
import { GmailWebhookHandlerService } from '@email/services/gmail-webhook-handler.service';

@Controller('email/webhook')
export class GmailWebhookController {
  constructor(private readonly gmailWebhookHandlerService: GmailWebhookHandlerService) {}

  @Post('webhook')
  @UseGuards(GmailWebhookGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async webhook(@Body() payload: PubSubPushPayload) {
    await this.gmailWebhookHandlerService.handle(payload);
  }
}
