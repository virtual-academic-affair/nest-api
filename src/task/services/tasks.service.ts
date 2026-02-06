import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ResourceService } from '@shared/resource/services/resource.service';
import { Task } from '@task/entities/task.entity';
import { CreateDto } from '@task/dtos/tasks/create.dto';
import { TaskAssignee } from '@task/entities/task-assignee.entity';
import { User } from '@authentication/entities/user.entity';
import { In } from 'typeorm';

@Injectable()
export class TasksService extends ResourceService<Task> {
  protected orderableColumns = ['id', 'messageId', 'createdAt', 'updatedAt'];

  constructor(
    @InjectRepository(Task) repository: Repository<Task>,
    @InjectRepository(TaskAssignee)
    private readonly assigneeRepo: Repository<TaskAssignee>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    super(repository);
  }
  async create(dto: CreateDto) {
    console.log('TasksService.create dto:', JSON.stringify(dto, null, 2));
    if (dto.taskAssignees) {
      const assigneeIds = dto.taskAssignees
        .map((a: any) => a.assigneeId)
        .filter((id) => id);

      let users: User[] = [];
      if (assigneeIds.length > 0) {
        users = await this.userRepo.find({ where: { id: In(assigneeIds) } });
      }

      dto.taskAssignees.forEach((assignee) => {
        if (dto.assignedAt && !assignee.assignedAt) {
          assignee.assignedAt = dto.assignedAt;
        }

        if (assignee.assigneeId) {
          const user = users.find((u) => u.id === assignee.assigneeId);
          if (user) {
            assignee.name = user.name;
          }
        }
      });
    }
    return super.create(dto);
  }

  async update(id: number, dto: any) {
    if (dto.taskAssignees) {
      const currentTask = await this.findOne(id);
      if (currentTask && currentTask.taskAssignees) {
        const existingIds = currentTask.taskAssignees.map((a) => a.id);
        const newIds = dto.taskAssignees
          .map((a: any) => a.id)
          .filter((id: any) => id); 

        const idsToDelete = existingIds.filter((id) => !newIds.includes(id));

        if (idsToDelete.length > 0) {
          await this.assigneeRepo.delete(idsToDelete);
        }
      }
    }

    if (dto.taskAssignees) {
      const assigneeIds = dto.taskAssignees
        .map((a: any) => a.assigneeId)
        .filter((id) => id);
      
      let users: User[] = [];
      if (assigneeIds.length > 0) {
        users = await this.userRepo.find({ where: { id: In(assigneeIds) } });
      }

      dto.taskAssignees.forEach((assignee: any) => {
        if (dto.assignedAt && !assignee.assignedAt) {
          assignee.assignedAt = dto.assignedAt;
        }

        if (assignee.assigneeId) {
          const user = users.find((u) => u.id === assignee.assigneeId);
          if (user) {
            assignee.name = user.name;
          }
        }
      });
    }

    return super.update(id, dto);
  }

  protected withAll(queryBuilder: SelectQueryBuilder<Task>): void {
    queryBuilder.leftJoinAndSelect('Task.taskAssignees', 'taskAssignees');

  }

  protected withOne(queryBuilder: SelectQueryBuilder<Task>): void {
    this.withAll(queryBuilder);
  }
}
