import { BadRequestException, Body, Controller, Headers, Post } from '@nestjs/common';
import { Auth } from '@authentication/decorators/auth.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { EmailSyncService } from '@email/services/email-send/email-sync.service';
import { PubsubPushAuthService } from '@email/services/pubsub-push-auth.service';

interface PubsubPushEnvelope {
  message?: {
    data?: string;
  };
}

interface GmailPushPayload {
  emailAddress?: string;
  historyId?: string;
}

@Controller('email/pubsub')
export class PubsubController {
  constructor(
    private readonly pubsubPushAuthService: PubsubPushAuthService,
    private readonly emailSyncService: EmailSyncService,
  ) {}

  @Post('push')
  @Auth(AuthType.None)
  async push(@Headers('authorization') authorization: string | undefined, @Body() body: PubsubPushEnvelope) {
    await this.pubsubPushAuthService.verifyAuthorizationHeader(authorization);

    const data = body?.message?.data;
    throwUnless(data, new BadRequestException('Missing Pub/Sub message data'));

    let payload: GmailPushPayload;
    try {
      payload = JSON.parse(Buffer.from(data, 'base64').toString('utf8')) as GmailPushPayload;
    } catch {
      throw new BadRequestException('Invalid Pub/Sub message payload');
    }

    throwUnless(payload.emailAddress, new BadRequestException('Missing Gmail push emailAddress'));
    throwUnless(payload.historyId, new BadRequestException('Missing Gmail push historyId'));

    return await this.emailSyncService.push(payload.emailAddress);
  }
}
