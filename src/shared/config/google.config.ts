import { registerAs } from '@nestjs/config';

export interface GoogleConfiguration {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  gmailRedirectUri: string;
}

export default registerAs<GoogleConfiguration>('google', () => {
  const apiBase = (process.env.APP_API ?? '').replace(/\/+$/, '');
  throwUnless(apiBase, new Error('APP_API is required'));

  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: `${apiBase}/authentication/google`,
    gmailRedirectUri: `${apiBase}/authentication/google/grant-gmail`,
  };
});
