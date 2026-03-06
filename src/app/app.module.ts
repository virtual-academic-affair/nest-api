import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ClsGuard, ClsModule, ClsService } from 'nestjs-cls';
import { AuthenticationModule } from '@authentication/authentication.module';
import { ClassRegistrationModule } from '@class-registration/class-registration.module';
import { EmailModule } from '@email/email.module';
import { InquiryModule } from '@inquiry/inquiry.module';
import { appConfig } from '@shared/config/app.config';
import { SharedModule } from '@shared/shared.module';
import { TaskModule } from '@task/task.module';
import { ClsServiceManager } from './cls-manager';

@Module({
  providers: [{ provide: APP_GUARD, useClass: ClsGuard }],
  imports: [
    ConfigModule.forRoot({ load: [appConfig] }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      url: process.env.DB_URL,
      type: process.env.DB_TYPE,
      autoLoadEntities: true,
      synchronize: true,
    } as TypeOrmModuleOptions),
    EmailModule,
    SharedModule,
    AuthenticationModule,
    ClassRegistrationModule,
    TaskModule,
    InquiryModule,
    ClsModule.forRoot({ global: true, middleware: { mount: true }, interceptor: { mount: false } }),
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly cls: ClsService) {}

  onModuleInit() {
    ClsServiceManager.setService(this.cls);
  }
}
