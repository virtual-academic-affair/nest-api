import { Body, Controller, HttpCode, HttpStatus, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { PayloadDto } from '@email/dtos/webhook/payload.dto';
import { GmailWebhookGuard } from '@email/guards/gmail-webhook.guard';
import { WebhookService } from '@email/services/gmail/webhook/webhook.service';

@Controller(['email/webhook'])
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @UseGuards(GmailWebhookGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async webhook(@Body() payload: PayloadDto, @Res() res: Response) {
    res.status(200).send('OK');
    await this.webhookService.handle(payload);
  }
}
