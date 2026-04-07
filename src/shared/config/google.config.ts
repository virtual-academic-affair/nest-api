import { registerAs } from '@nestjs/config';

export interface GoogleConfiguration {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  pubsubTopic: string;
  pubsubAudience: string;
  pubsubPushServiceAccountEmail: string;
}

export default registerAs<GoogleConfiguration>('google', () => {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    pubsubTopic: process.env.GOOGLE_PUBSUB_TOPIC ?? '',
    pubsubAudience: process.env.GOOGLE_PUBSUB_AUDIENCE ?? '',
    pubsubPushServiceAccountEmail: process.env.GOOGLE_PUBSUB_PUSH_SERVICE_ACCOUNT_EMAIL ?? '',
  };
});
