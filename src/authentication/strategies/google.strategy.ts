import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import googleConfig from '@shared/config/google.config';

export type GoogleProfile = {
  email: string;
  googleId: string;
  name?: string;
  picture?: string;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(@Inject(googleConfig.KEY) private readonly googleConfiguration: ConfigType<typeof googleConfig>) {
    super({
      clientID: googleConfiguration.clientId,
      clientSecret: googleConfiguration.clientSecret,
      callbackURL: googleConfiguration.redirectUri,
      scope: ['openid', 'email', 'profile'],
    });
  }

  validate(_accessToken: string, _refreshToken: string, profile: Profile): GoogleProfile {
    const email = profile.emails?.[0]?.value;
    throwUnless(email, new Error('Google email is missing'));

    return {
      email,
      googleId: profile.id,
      name: profile.displayName,
      picture: profile.photos?.[0]?.value,
    };
  }
}
