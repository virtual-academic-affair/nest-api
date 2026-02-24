import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  url: process.env.APP_URL ?? 'https://vaa.hcmus.edu.vn',
  name: process.env.APP_NAME ?? 'Virtual Academic Affair',
  emailLogoUrl: process.env.EMAIL_LOGO_URL ?? '',
}));
