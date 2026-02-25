import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request as TRequest } from 'express';
import { Repository } from 'typeorm';
import { ResourceItemService } from '@shared/resource/services/resource-item.service';
import { TaskItem } from '@task/entities/task-item.entity';

@Injectable({ scope: Scope.REQUEST })
export class TaskItemsService extends ResourceItemService<TaskItem> {
  constructor(@InjectRepository(TaskItem) repository: Repository<TaskItem>, @Inject(REQUEST) request: TRequest) {
    super(repository, request);
  }
}
