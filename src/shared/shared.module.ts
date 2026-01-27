import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import googleConfig from '@shared/config/google.config';
import jwtConfig from '@shared/config/jwt.config';
import rabbitmqConfig from '@shared/config/rabbitmq.config';
import { RestrictMethodsGuard } from '@shared/resource/guards/restrict-methods.guard';
import { RabbitMQService } from '@shared/services/rabbitmq.service';
import { Setting } from '@shared/setting/entities/setting.entity';
import redisConfig from '@shared/config/redis.config';
import { BcryptService } from '@shared/hashing/bcrypt.service';
import { HashingService } from '@shared/hashing/hashing.service';
import { RedisService } from '@shared/services/redis.service';
import { SettingService } from '@shared/setting/services/setting.service';
import { RabbitMQController } from '@shared/messaging/controllers/rabbitmq.controller';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Setting]),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(redisConfig),
    ConfigModule.forFeature(rabbitmqConfig),
    ConfigModule.forFeature(googleConfig),
  ],
  controllers: [RabbitMQController],
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
