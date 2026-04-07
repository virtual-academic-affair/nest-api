import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import googleConfig from '@shared/config/google.config';

@Injectable()
export class PubsubPushAuthService {
  private readonly client = new OAuth2Client();

  constructor(@Inject(googleConfig.KEY) private readonly googleConfiguration: ConfigType<typeof googleConfig>) {}

  async verifyAuthorizationHeader(authorization?: string): Promise<void> {
    throwUnless(
      this.googleConfiguration.pubsubAudience,
      new UnauthorizedException('Pub/Sub audience is not configured'),
    );

    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    throwUnless(token, new UnauthorizedException('Missing Pub/Sub bearer token'));

    const ticket = await this.client.verifyIdToken({
      idToken: token,
      audience: this.googleConfiguration.pubsubAudience,
    });
    const payload = ticket.getPayload();

    throwUnless(payload, new UnauthorizedException('Invalid Pub/Sub token payload'));
    throwUnless(
      payload.iss === 'accounts.google.com' || payload.iss === 'https://accounts.google.com',
      new UnauthorizedException('Invalid Pub/Sub token issuer'),
    );

    const expectedEmail = this.googleConfiguration.pubsubPushServiceAccountEmail;
    if (expectedEmail) {
      throwUnless(payload.email_verified, new UnauthorizedException('Unverified Pub/Sub service account email'));
      throwUnless(payload.email === expectedEmail, new UnauthorizedException('Unexpected Pub/Sub service account'));
    }
  }
}
