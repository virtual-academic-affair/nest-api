import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import { DataSource, In, LessThanOrEqual, MoreThanOrEqual, Repository, SelectQueryBuilder } from 'typeorm';
import { REQUEST_USER_KEY } from '@authentication/guards/authentication.guard';
import { ActiveUserData } from '@authentication/interfaces/active-user-data.interface';
import { MessageLabelsService } from '@email/services/message-labels.service';
import { SystemLabel } from '@shared/enums/system-label.enum';
import { applyMessageFilters } from '@shared/resource/dtos/message-resource-query.dto';
import { ResourceService } from '@shared/resource/services/resource.service';
import { CreateDto } from '@task/dtos/tasks/create.dto';
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
    private readonly messageLabelsService: MessageLabelsService,
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
    { statuses, priorities, dueDateFrom, dueDateTo, assigneeIds, messageId, messageStatuses }: QueryDto,
  ): void {
    applyMessageFilters(queryBuilder, { messageId, messageStatuses });
    statuses?.length && queryBuilder.andWhere({ status: In(statuses) });
    priorities?.length && queryBuilder.andWhere({ priority: In(priorities) });
    dueDateFrom && queryBuilder.andWhere({ due: MoreThanOrEqual(dueDateFrom) });
    dueDateTo && queryBuilder.andWhere({ due: LessThanOrEqual(dueDateTo) });

    if (assigneeIds?.length) {
      queryBuilder.andWhere(
        (q) =>
          `${q.alias}.id IN ${q
            .subQuery()
            .select('ta.taskId')
            .from(TaskAssignee, 'ta')
            .where({ assigneeId: In(assigneeIds) })
            .getQuery()}`,
      );
    }
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

  async create(dto: CreateDto): Promise<Task> {
    if (dto?.messageId) {
      await this.messageLabelsService.run(dto.messageId, null, false, [SystemLabel.Task]);
    }

    return super.create({ ...dto, assignees: this.enrichAssignees(dto.assigneeIds) });
  }

  enrichAssignees(assigneeIds: number[]) {
    const userId = this.cls.get<ActiveUserData>(REQUEST_USER_KEY).sub;
    return assigneeIds?.map((id) => ({ assigneeId: id, assignerId: userId }));
  }

  async update(id: number, { assigneeIds, ...data }: UpdateDto): Promise<Task> {
    if (!assigneeIds) {
      return super.update(id, data);
    }

    return this.dataSource.transaction(async (manager) => {
      await manager.findOneOrFail(Task, { where: { id }, lock: { mode: 'pessimistic_write' } });

      if (Object.keys(data).length > 0) {
        await manager.update(Task, id, data);
      }

      const existingAssignees = await manager.find(TaskAssignee, { where: { taskId: id }, select: ['assigneeId'] });
      const existingIds = existingAssignees.map((a) => a.assigneeId);

      const toDeleteIds = existingIds.filter((eId) => !assigneeIds.includes(eId));
      const toInsertIds = assigneeIds.filter((nId) => !existingIds.includes(nId));

      const dbTasks: Promise<any>[] = [];

      if (toDeleteIds.length > 0) {
        dbTasks.push(manager.delete(TaskAssignee, { taskId: id, assigneeId: In(toDeleteIds) }));
      }

      if (toInsertIds.length > 0) {
        const insertPayload = this.enrichAssignees(toInsertIds).map((a) => ({ ...a, taskId: id }));
        dbTasks.push(manager.insert(TaskAssignee, insertPayload));
      }

      await Promise.all(dbTasks);

      return manager.findOneOrFail(Task, { where: { id } });
    });
  }
}
