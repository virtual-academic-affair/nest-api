import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ClientsModule } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import googleConfig from '@shared/config/google.config';
import grpcConfig from '@shared/config/grpc.config';
import jwtConfig from '@shared/config/jwt.config';
import redisConfig from '@shared/config/redis.config';
import { BcryptService } from '@shared/hashing/bcrypt.service';
import { HashingService } from '@shared/hashing/hashing.service';
import { RestrictMethodsGuard } from '@shared/resource/guards/restrict-methods.guard';
import { RedisService } from '@shared/services/redis.service';
import { Setting } from '@shared/setting/entities/setting.entity';
import { SettingService } from '@shared/setting/services/setting.service';
import rabbitmqConfig from '@shared/config/rabbitmq.config';
import { GRPC_SERVICE, RABBIT_SERVICE } from '@shared/config/constants';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Setting]),
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(redisConfig),
    ConfigModule.forFeature(rabbitmqConfig),
    ConfigModule.forFeature(grpcConfig),
    ConfigModule.forFeature(googleConfig),
    ClientsModule.registerAsync([
      {
        imports: [ConfigModule],
        name: RABBIT_SERVICE,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => config.get('rabbitmq'),
      },
      {
        imports: [ConfigModule],
        name: GRPC_SERVICE,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => config.get('grpc'),
      },
    ]),
  ],
  controllers: [],
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
  ],
  exports: [
    TypeOrmModule,
    HashingService,
    SettingService,
    RedisService,
    ClientsModule,
  ],
})
export class SharedModule {}
