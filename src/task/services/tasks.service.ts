import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceService } from '@shared/resource/services/resource.service';
import { Task } from '@task/entities/task.entity';

@Injectable()
export class TasksService extends ResourceService<Task> {
  protected searchableColumns: string[] = [];

  protected orderableColumns = ['id', 'messageId', 'createdAt', 'updatedAt'];

  constructor(@InjectRepository(Task) repository: Repository<Task>) {
    super(repository);
  }
}
