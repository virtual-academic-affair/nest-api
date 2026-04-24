import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import gmailWatchConfig from '@shared/config/gmail-watch.config';

@Injectable()
export class GmailWebhookGuard implements CanActivate {
  private readonly tokenVerifier = new OAuth2Client();

  constructor(
    @Inject(gmailWatchConfig.KEY) private readonly gmailWatchConfiguration: ConfigType<typeof gmailWatchConfig>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const idToken = (request.headers['authorization'] as string).replace(/^Bearer\s+/i, '').trim();
    throwUnless(idToken, new UnauthorizedException('Missing token'));

    const ticket = await this.tokenVerifier.verifyIdToken({
      idToken,
      audience: this.gmailWatchConfiguration.pubsubAudience,
    });
    const payload = ticket.getPayload();
    throwUnless(payload?.email_verified, new UnauthorizedException('Unverified Pub/Sub token email'));
    throwUnless(
      payload?.email === this.gmailWatchConfiguration.pushServiceAccountEmail,
      new UnauthorizedException('Invalid Pub/Sub push service account'),
    );

    return true;
  }
}
