import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { GmailWebhookGuard } from '@email/guards/gmail-webhook.guard';
import { PubSubPushPayload } from '@email/services/gmail/gmail-webhook.service';
import { WebhookService } from '@email/services/webhook.service';

@Controller('email/webhook')
export class WebhookController {
  constructor(private readonly gmailWebhookHandlerService: WebhookService) {}

  @Post()
  @UseGuards(GmailWebhookGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async webhook(@Body() payload: PubSubPushPayload) {
    await this.gmailWebhookHandlerService.handle(payload);
  }
}
