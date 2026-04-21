import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '@email/email.module';
import { ClassRegistrationItemsController } from './controllers/class-registration-items.controller';
import { ClassRegistrationsController } from './controllers/class-registrations.controller';
import { ClassRegistrationItem } from './entities/class-registration-item.entity';
import { ClassRegistration } from './entities/class-registration.entity';
import { ClassRegistrationItemsService } from './services/class-registration-items.service';
import { ClassRegistrationsService } from './services/class-registrations.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ClassRegistration, ClassRegistrationItem]),
    EmailModule,
  ],
  controllers: [ClassRegistrationsController, ClassRegistrationItemsController],
  providers: [ClassRegistrationsService, ClassRegistrationItemsService],
  exports: [ClassRegistrationsService],
})
export class ClassRegistrationModule {}
