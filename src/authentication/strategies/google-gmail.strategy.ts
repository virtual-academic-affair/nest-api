import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import googleConfig from '@shared/config/google.config';

export type GoogleGmailProfile = {
  email: string;
  googleId: string;
  refreshToken: string;
  name?: string;
  picture?: string;
};

@Injectable()
export class GoogleGmailStrategy extends PassportStrategy(Strategy, 'google-gmail') {
  constructor(@Inject(googleConfig.KEY) private readonly googleConfiguration: ConfigType<typeof googleConfig>) {
    super({
      clientID: googleConfiguration.clientId,
      clientSecret: googleConfiguration.clientSecret,
      callbackURL: googleConfiguration.gmailRedirectUri,
      scope: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/gmail.modify'],
      // passport-google-oauth20 supports these Google params at runtime;
      // typings don't always include them across versions.
      accessType: 'offline',
      prompt: 'consent',
    } as any);
  }

  validate(_accessToken: string, refreshToken: string, profile: Profile): GoogleGmailProfile {
    const email = profile.emails?.[0]?.value;
    throwUnless(email, new Error('Google email is missing'));
    throwUnless(refreshToken, new Error('Google refresh token is missing'));

    return {
      email,
      googleId: profile.id,
      refreshToken,
      name: profile.displayName,
      picture: profile.photos?.[0]?.value,
    };
  }
}
