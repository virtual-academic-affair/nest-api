import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AuthenticationModule } from '@authentication/authentication.module';
import { ClassRegistrationModule } from '@class-registration/class-registration.module';
import { EmailModule } from '@email/email.module';
import { InquiryModule } from '@inquiry/inquiry.module';
import { appConfig } from '@shared/config/app.config';
import { SharedModule } from '@shared/shared.module';
import { TaskModule } from '@task/task.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig],
    }),
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
  ],
})
export class AppModule {}
