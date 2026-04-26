import { Global, Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ClientsModule } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '@email/email.module';
import { GRPC_SERVICE, RABBIT_SERVICE } from '@shared/config/constants';
import googleConfig from '@shared/config/google.config';
import grpcConfig from '@shared/config/grpc.config';
import jwtConfig from '@shared/config/jwt.config';
import rabbitmqConfig from '@shared/config/rabbitmq.config';
import redisConfig from '@shared/config/redis.config';
import { AesEncryptionService } from '@shared/encryption/aes-encryption.service';
import { EncryptionService } from '@shared/encryption/encryption.service';
import { BcryptService } from '@shared/hashing/bcrypt.service';
import { HashingService } from '@shared/hashing/hashing.service';
import { RedisService } from '@shared/redis/redis.service';
import { RestrictMethodsGuard } from '@shared/resource/guards/restrict-methods.guard';
import { SettingsController } from '@shared/setting/controllers/settings.controller';
import { Setting } from '@shared/setting/entities/setting.entity';
import { SettingService } from '@shared/setting/services/setting.service';

@Global()
@Module({
  imports: [
    forwardRef(() => EmailModule),
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
        useFactory: (config: ConfigService) => config.getOrThrow('grpc'),
      },
    ]),
  ],
  controllers: [SettingsController],
  providers: [
    { provide: HashingService, useClass: BcryptService },
    { provide: EncryptionService, useClass: AesEncryptionService },
    { provide: APP_GUARD, useClass: RestrictMethodsGuard },
    SettingService,
    RedisService,
  ],
  exports: [TypeOrmModule, HashingService, EncryptionService, SettingService, ClientsModule, RedisService],
})
export class SharedModule {}
