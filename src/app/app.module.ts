import { Module, OnModuleInit, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ClsGuard, ClsModule, ClsService } from 'nestjs-cls';
import { AuthenticationModule } from '@authentication/authentication.module';
import { ClassRegistrationModule } from '@class-registration/class-registration.module';
import { EmailModule } from '@email/email.module';
import { InquiryModule } from '@inquiry/inquiry.module';
import { appConfig } from '@shared/config/app.config';
import { SharedModule } from '@shared/shared.module';
import { SocketModule } from './socket/socket.module';
import { ClsServiceManager } from './cls-manager';
import { UnifiedExceptionFilter } from './filters/unified-exception.filter';
import { GrpcResponseInterceptor } from './interceptors/grpc-response.interceptor';
import { HttpResponseInterceptor } from './interceptors/http-response.interceptor';

@Module({
  providers: [
    { provide: APP_GUARD, useClass: ClsGuard },
    { provide: APP_INTERCEPTOR, useClass: HttpResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: GrpcResponseInterceptor },
    { provide: APP_FILTER, useClass: UnifiedExceptionFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        whitelist: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    },
  ],
  imports: [
    ConfigModule.forRoot({ load: [appConfig] }),
    TypeOrmModule.forRoot({
      url: process.env.DB_URL,
      type: process.env.DB_TYPE,
      autoLoadEntities: true,
      synchronize: false,
      ssl: {
        rejectUnauthorized: false,
      },
    } as TypeOrmModuleOptions),
    EmailModule,
    SharedModule,
    AuthenticationModule,
    ClassRegistrationModule,
    InquiryModule,
    SocketModule,
    ClsModule.forRoot({ global: true, middleware: { mount: true }, interceptor: { mount: false } }),
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly cls: ClsService) {}

  onModuleInit() {
    ClsServiceManager.setService(this.cls);
  }
}
