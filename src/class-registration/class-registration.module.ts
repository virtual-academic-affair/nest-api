import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { ClassRegistrationsController } from '@class-registration/controllers/class-registrations.controller';
import { ClassRegistrationsService } from '@class-registration/services/class-registrations.service';

@Module({
  imports: [TypeOrmModule.forFeature([ClassRegistration])],
  controllers: [ClassRegistrationsController],
  providers: [ClassRegistrationsService],
  exports: [],
})
export class ClassRegistrationModule {}
