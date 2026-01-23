import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import jwtConfig from '@shared/config/jwt.config';
import rabbitmqConfig from '@shared/config/rabbitmq.config';
import googleConfig from '@shared/config/google.config';
import redisConfig from './config/redis.config';
import { BcryptService } from './hashing/bcrypt.service';
import { HashingService } from './hashing/hashing.service';
import { RestrictMethodsGuard } from '@shared/resource/guards/restrict-methods.guard';
import { Setting } from '@shared/setting/entities/setting.entity';
import { SettingService } from './setting/services/setting.service';
import { RedisService } from './services/redis.service';
import { RabbitMQService } from '@shared/services/rabbitmq.service';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    TypeOrmModule.forFeature([Setting]),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(redisConfig),
    ConfigModule.forFeature(rabbitmqConfig),
    ConfigModule.forFeature(googleConfig),
  ],
  providers: [
    {
      provide: HashingService,
      useClass: BcryptService,
    },
    {
      provide: APP_GUARD,
      useClass: RestrictMethodsGuard,
    },
    SettingService,
    RedisService,
    RabbitMQService,
  ],
  exports: [
    TypeOrmModule,
    HashingService,
    SettingService,
    RedisService,
    RabbitMQService,
  ],
})
export class SharedModule {}
