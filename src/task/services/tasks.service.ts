import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { ResourceService } from '@shared/resource/services/resource.service';
import { Task } from '@task/entities/task.entity';
import { TaskAssignee } from '@task/entities/task-assignee.entity';
import { CreateDto } from '@task/dtos/tasks/create.dto';
import { User } from '@authentication/entities/user.entity';

@Injectable()
export class TasksService extends ResourceService<Task> {
  protected orderableColumns = ['id', 'messageId', 'createdAt', 'updatedAt'];

  constructor(
    @InjectRepository(Task) repository: Repository<Task>,
    @InjectRepository(TaskAssignee)
    private readonly assigneeRepo: Repository<TaskAssignee>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) {
    super(repository);
  }

  async create(dto: CreateDto) {
    await this.enrichAssignees(dto);
    return super.create(dto);
  }

  async update(id: number, dto: CreateDto) {
    await this.enrichAssignees(dto);

    if (dto.taskAssignees) {
      const currentTask = await this.findOne(id);

      if (currentTask?.taskAssignees) {
        const newIds = dto.taskAssignees
          .map((a) => a.id)
          .filter(Boolean) as number[];
        const idsToDelete = currentTask.taskAssignees
          .map((a) => a.id)
          .filter((existingId) => !newIds.includes(existingId));

        if (idsToDelete.length > 0) {
          await this.assigneeRepo.delete(idsToDelete);
        }
      }

      dto.taskAssignees.forEach((a: any) => (a.taskId = id));
    }

    return super.update(id, dto);
  }

  private async enrichAssignees(dto: CreateDto) {
    if (!dto.taskAssignees?.length) {
      return;
    }

    const assigneeIds = dto.taskAssignees
      .map((a) => a.assigneeId)
      .filter(Boolean) as number[];

    const users = assigneeIds.length
      ? await this.userRepo.find({ where: { id: In(assigneeIds) } })
      : [];

    for (const assignee of dto.taskAssignees) {
      if (!assignee.assignedAt) {
        assignee.assignedAt = new Date();
      }
      const user = assignee.assigneeId
        ? users.find((u) => u.id === assignee.assigneeId)
        : undefined;
      if (user) {
        assignee.name = user.name;
      }
    }
  }

  protected withAll(qb: SelectQueryBuilder<Task>): void {
    qb.leftJoinAndSelect('Task.taskAssignees', 'taskAssignees');
  }

  protected withOne(qb: SelectQueryBuilder<Task>): void {
    this.withAll(qb);
  }
}
