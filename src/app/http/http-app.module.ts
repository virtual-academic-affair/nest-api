import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ApiResponseModule } from '@zabih-dev/nest-api-response';
import { AppModule } from '../app.module';

@Module({
  imports: [ApiResponseModule, AppModule, ScheduleModule.forRoot()],
  providers: [
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
})
export class HttpAppModule {}
