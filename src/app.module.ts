import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ApiResponseModule } from '@zabih-dev/nest-api-response';
import { DatabaseType } from 'typeorm';
import { AuthenticationModule } from '@authentication/authentication.module';
import { SharedModule } from '@shared/shared.module';
import { EmailModule } from '@email/email.module';
import { ClassRegistrationModule } from '@class-registration/class-registration.module';
import { TaskModule } from '@task/task.module';
import { InquiryModule } from '@inquiry/inquiry.module';

@Module({
  imports: [
    ApiResponseModule,
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE as DatabaseType,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
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
