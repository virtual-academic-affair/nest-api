import { Module } from '@nestjs/common';
import { ApiResponseModule } from '@zabih-dev/nest-api-response';
import { AppModule } from '../app.module';

@Module({
  imports: [ApiResponseModule, AppModule],
})
export class HttpAppModule {}
