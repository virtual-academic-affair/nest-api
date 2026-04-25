import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthenticationModule } from '@authentication/authentication.module';
import { ClassRegistrationModule } from '@class-registration/class-registration.module';
import { EmailModule } from '@email/email.module';
import { InquiryModule } from '@inquiry/inquiry.module';
import { appConfig } from '@shared/config/app.config';
import { SharedModule } from '@shared/shared.module';
import { UnifiedExceptionFilter } from './filters/unified-exception.filter';
import { GrpcResponseInterceptor } from './interceptors/grpc-response.interceptor';
import { HttpResponseInterceptor } from './interceptors/http-response.interceptor';

@Module({
  providers: [
    { provide: APP_INTERCEPTOR, useClass: HttpResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: GrpcResponseInterceptor },
    { provide: APP_FILTER, useClass: UnifiedExceptionFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        whitelist: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    },
  ],
  imports: [
    ConfigModule.forRoot({ load: [appConfig] }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      url: process.env.DB_URL,
      type: process.env.DB_TYPE,
      autoLoadEntities: true,
      synchronize: true,
      ssl: {
        rejectUnauthorized: false,
      },
    } as TypeOrmModuleOptions),
    EmailModule,
    SharedModule,
    AuthenticationModule,
    ClassRegistrationModule,
    InquiryModule,
  ],
})
export class AppModule {}
