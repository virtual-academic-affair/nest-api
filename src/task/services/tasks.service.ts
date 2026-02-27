import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { DataSource, In, LessThanOrEqual, MoreThanOrEqual, Repository, SelectQueryBuilder } from 'typeorm';
import { REQUEST_USER_KEY } from '@authentication/guards/authentication.guard';
import { ActiveUserData } from '@authentication/interfaces/active-user-data.interface';
import { ResourceService } from '@shared/resource/services/resource.service';
import { QueryDto } from '@task/dtos/tasks/query.dto';
import { UpdateDto } from '@task/dtos/tasks/update.dto';
import { TaskAssignee } from '@task/entities/task-assignee.entity';
import { Task } from '@task/entities/task.entity';
import { TaskStatus } from '@task/enums/task-status.enum';

@Injectable()
export class TasksService extends ResourceService<Task> {
  protected orderableColumns = ['due'];
  protected searchableColumns = ['name', 'description'];

  constructor(
    @InjectRepository(Task) repository: Repository<Task>,
    private readonly cls: ClsService,
    private readonly dataSource: DataSource,
  ) {
    super(repository);
  }

  protected withAll(queryBuilder: SelectQueryBuilder<Task>): void {
    queryBuilder
      .leftJoinAndSelect(this.p('assignees'), 'assignees')
      .leftJoinAndSelect('assignees.assignee', 'assignee');
  }

  protected withOne(queryBuilder: SelectQueryBuilder<Task>): void {
    queryBuilder
      .leftJoinAndSelect(this.p('assignees'), 'assignees')
      .leftJoinAndSelect('assignees.assignee', 'assignee')
      .leftJoinAndSelect('assignees.assigner', 'assigner')
      .leftJoinAndSelect(this.p('message'), 'message');
  }

  protected applyCustomFilters(
    queryBuilder: SelectQueryBuilder<Task>,
    { status, priority, dueDateFrom, dueDateTo, assigneeIds }: QueryDto,
  ): void {
    status && queryBuilder.andWhere({ status });
    priority && queryBuilder.andWhere({ priority });
    dueDateFrom && queryBuilder.andWhere({ due: MoreThanOrEqual(dueDateFrom) });
    dueDateTo && queryBuilder.andWhere({ due: LessThanOrEqual(dueDateTo) });
    assigneeIds && queryBuilder.andWhere({ assignees: { assigneeId: In(assigneeIds) } });
  }

  async stats(startDate: Date, endDate: Date) {
    const stats = await this.queryBuilder
      .select([
        `DATE(${this.p('due')}) AS date`,
        `${this.p('priority')} AS priority`,
        'COUNT(*) AS total',
        `SUM(CASE WHEN ${this.p('status')} = '${TaskStatus.Todo}' THEN 1 ELSE 0 END) AS todo`,
        `SUM(CASE WHEN ${this.p('status')} = '${TaskStatus.Doing}' THEN 1 ELSE 0 END) AS doing`,
        `SUM(CASE WHEN ${this.p('status')} = '${TaskStatus.Done}' THEN 1 ELSE 0 END) AS done`,
        `SUM(CASE WHEN ${this.p('status')} = '${TaskStatus.Cancelled}' THEN 1 ELSE 0 END) AS cancelled`,
      ])
      .where(`${this.p('due')} BETWEEN :startDate AND :endDate`, { startDate, endDate })
      .groupBy(`DATE(${this.p('due')}), priority`)
      .getRawMany();

    return stats.reduce((acc, { date, priority, ...counts }) => {
      date = new Date(date).toISOString();

      acc[date] = acc[date] || { date, total: 0, detail: {} };
      acc[date]['detail'][priority || 'none'] = Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, +v]));
      acc[date].total += +counts.total;
      return acc;
    }, {});
  }

  async create(createDto: any): Promise<Task> {
    return super.create({
      ...createDto,
      assignees: this.enrichAssignees(createDto.assigneeIds),
    });
  }

  enrichAssignees(assigneeIds: number[]) {
    const userId = this.cls.get<ActiveUserData>(REQUEST_USER_KEY).sub;
    return assigneeIds?.map((id) => ({ assigneeId: id, assignerId: userId }));
  }

  async update(id: number, updateDto: UpdateDto): Promise<Task> {
    if (!updateDto?.assigneeIds) {
      return super.update(id, updateDto);
    }

    return await this.dataSource.transaction(async (manager) => {
      const task = await manager.findOneOrFail(Task, {
        where: { id },
        relations: ['assignees'],
        lock: { mode: 'pessimistic_write' },
      });

      const newAssigneeIds = updateDto.assigneeIds;
      const currentAssigneeIds = task.assignees.map((a) => a.assigneeId);

      const toDelete = currentAssigneeIds
        .filter((c) => !newAssigneeIds.includes(c))
        .map((c) => ({ taskId: id, assigneeId: c }));

      if (toDelete.length > 0) {
        await manager.delete(TaskAssignee, toDelete);
      }

      const updatedTask = manager.create(Task, {
        ...task,
        ...updateDto,
        assignees: this.enrichAssignees(newAssigneeIds),
        id,
      });

      return await manager.save(updatedTask);
    });
  }
}
