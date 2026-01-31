import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassRegistration } from './entities/class-registration.entity';
import { RegistrationItemDetail } from './entities/registration-item-detail.entity';
import { CancelReasonMaster } from './entities/cancel-reason-master.entity';
import { ClassRegistrationConsumer } from './messaging/consumers/class-registration.consumer';
import { ClassRegistrationsService } from './services/class-registrations.service';
import { RegistrationItemsService } from './services/registration-items.service';
import { CancelReasonsService } from './services/cancel-reasons.service';
import { ClassRegistrationsController } from './controllers/class-registrations.controller';
import { RegistrationItemsController } from './controllers/registration-items.controller';
import { CancelReasonsController } from './controllers/cancel-reasons.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClassRegistration,
      RegistrationItemDetail,
      CancelReasonMaster,
    ]),
  ],
  controllers: [
    ClassRegistrationsController,
    RegistrationItemsController,
    CancelReasonsController,
  ],
  providers: [
    ClassRegistrationsService,
    RegistrationItemsService,
    CancelReasonsService,
    ClassRegistrationConsumer,
  ],
  exports: [ClassRegistrationsService],
})
export class ClassRegistrationModule {}
