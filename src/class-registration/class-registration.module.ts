import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '@email/email.module';
import { CancelReasonsController } from './controllers/cancel-reasons.controller';
import { ClassRegistrationItemsController } from './controllers/class-registration-items.controller';
import { ClassRegistrationsController } from './controllers/class-registrations.controller';
import { CancelReason } from './entities/cancel-reason.entity';
import { ClassRegistrationItem } from './entities/class-registration-item.entity';
import { ClassRegistration } from './entities/class-registration.entity';
import { CancelReasonsService } from './services/cancel-reasons.service';
import { ClassRegistrationItemsService } from './services/class-registration-items.service';
import { ClassRegistrationsService } from './services/class-registrations.service';

@Module({
  imports: [TypeOrmModule.forFeature([ClassRegistration, ClassRegistrationItem, CancelReason]), EmailModule],
  controllers: [ClassRegistrationsController, ClassRegistrationItemsController, CancelReasonsController],
  providers: [ClassRegistrationsService, ClassRegistrationItemsService, CancelReasonsService],
  exports: [ClassRegistrationsService],
})
export class ClassRegistrationModule {}
