import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { PayloadDto } from '@email/dtos/webhook/payload.dto';
import { GmailWebhookGuard } from '@email/guards/gmail-webhook.guard';
import { WebhookService } from '@email/services/webhook.service';

@Controller(['email/webhook'])
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @UseGuards(GmailWebhookGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async webhook(@Body() payload: PayloadDto) {
    await this.webhookService.handle(payload);
  }
}
