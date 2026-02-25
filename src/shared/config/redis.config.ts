import { registerAs } from '@nestjs/config';

export interface RedisConfiguration {
  url: string;
}

export default registerAs<RedisConfiguration>('redis', () => {
  return {
    url: process.env.REDIS_URL,
  };
});
