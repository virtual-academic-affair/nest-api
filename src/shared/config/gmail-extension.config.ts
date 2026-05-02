import { registerAs } from '@nestjs/config';

export type GmailExtensionConfiguration = {
  sessionSecret: string;
};

export default registerAs<GmailExtensionConfiguration>('gmailExtension', () => ({
  sessionSecret: process.env.GMAIL_EXTENSION_SESSION_SECRET ?? '',
}));
