import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceService } from '@shared/resource/services/resource.service';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';

@Injectable()
export class ClassRegistrationsService extends ResourceService<ClassRegistration> {
  protected orderableColumns = ['id', 'messageId', 'createdAt', 'updatedAt'];

  constructor(
    @InjectRepository(ClassRegistration)
    repository: Repository<ClassRegistration>
  ) {
    super(repository);
  }
}
