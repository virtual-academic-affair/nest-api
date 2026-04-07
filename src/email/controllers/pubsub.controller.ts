import { BadRequestException, Body, Controller, Headers, Post } from '@nestjs/common';
import { Auth } from '@authentication/decorators/auth.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { SuperEmailSetting } from '@email/interfaces/super-email-setting.type';
import { EmailSyncService } from '@email/services/email-send/email-sync.service';
import { PubsubPushAuthService } from '@email/services/pubsub-push-auth.service';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

interface PubsubPushEnvelope {
  message?: {
    data?: string;
  };
}

interface GmailPushPayload {
  emailAddress?: string;
}

@Controller('email/pubsub')
export class PubsubController {
  constructor(
    private readonly pubsubPushAuthService: PubsubPushAuthService,
    private readonly emailSyncService: EmailSyncService,
    private readonly settingService: SettingService,
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

    const superEmail = await this.settingService.get<SuperEmailSetting>(SettingKey.EmailSuperEmail);
    if (!superEmail?.email || superEmail.email !== payload.emailAddress) {
      return { ignored: true };
    }

    await this.emailSyncService.run();
    return { ignored: false };
  }
}
