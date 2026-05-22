import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { PayloadDto } from '@email/dtos/webhook/payload.dto';
import { GmailWebhookGuard } from '@email/guards/gmail-webhook.guard';
import { WebhookService } from '@email/services/gmail/webhook/webhook.service';
import { validateDto } from '@shared/resource/utils/validate-dto.util';

@Controller(['email/webhook'])
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @UseGuards(GmailWebhookGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async webhook(@Body() body: unknown, @Req() req: Request, @Res() res: Response) {
    const payload = await validateDto(PayloadDto, this.normalizePayload(body, req), true);
    res.status(200).send('OK');
    await this.webhookService.handle(payload);
  }

  private normalizePayload(body: unknown, req: Request): object {
    const direct = this.parseUnknown(body);
    if (this.isPayloadShape(direct)) {
      return direct;
    }

    const raw = this.parseUnknown((req as Request & { rawBody?: Buffer | string }).rawBody);
    if (this.isPayloadShape(raw)) {
      return raw;
    }

    const unwrappedDirect = this.unwrapPubSubEnvelope(direct);
    if (this.isPayloadShape(unwrappedDirect)) {
      return unwrappedDirect;
    }

    const unwrappedRaw = this.unwrapPubSubEnvelope(raw);
    if (this.isPayloadShape(unwrappedRaw)) {
      return unwrappedRaw;
    }

    return (direct as object) ?? (raw as object) ?? {};
  }

  private unwrapPubSubEnvelope(value: unknown): unknown {
    if (!value || typeof value !== 'object') {
      return undefined;
    }

    const data = (value as { message?: { data?: unknown } }).message?.data;
    if (typeof data !== 'string' || !data.trim()) {
      return undefined;
    }

    try {
      return JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
    } catch {
      return undefined;
    }
  }

  private parseUnknown(value: unknown): unknown {
    if (value == null) {
      return undefined;
    }

    if (Buffer.isBuffer(value)) {
      return this.parseUnknown(value.toString('utf8'));
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return undefined;
      }

      try {
        return JSON.parse(trimmed);
      } catch {
        return undefined;
      }
    }

    return value;
  }

  private isPayloadShape(value: unknown): value is PayloadDto {
    return !!value && typeof value === 'object' && 'emailAddress' in value && 'historyId' in value;
  }
}
