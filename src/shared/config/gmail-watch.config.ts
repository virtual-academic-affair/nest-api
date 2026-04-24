import { registerAs } from '@nestjs/config';

export interface GmailWatchConfiguration {
  topicName: string;
  pubsubAudience?: string;
  pushServiceAccountEmail?: string;
}

export default registerAs<GmailWatchConfiguration>('gmailWatch', () => ({
  topicName: process.env.GMAIL_WATCH_TOPIC_NAME?.trim() ?? '',
  pubsubAudience: process.env.GOOGLE_PUBSUB_AUDIENCE?.trim() || '',
  pushServiceAccountEmail: process.env.GOOGLE_PUBSUB_PUSH_SERVICE_ACCOUNT_EMAIL?.trim() || '',
}));
