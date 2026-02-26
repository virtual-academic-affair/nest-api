import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { ResourceService } from '@shared/resource/services/resource.service';
import { QueryDto } from '@task/dtos/tasks/query.dto';
import { Task } from '@task/entities/task.entity';
import { TaskStatus } from '@task/enums/task-status.enum';

@Injectable()
export class TasksService extends ResourceService<Task> {
  protected orderableColumns = ['due'];
  protected searchableColumns = ['name', 'description'];

  constructor(@InjectRepository(Task) repository: Repository<Task>) {
    super(repository);
  }

  protected withAll(queryBuilder: SelectQueryBuilder<Task>): void {
    queryBuilder.leftJoinAndSelect(this.p('items'), 'items');
  }

  protected withOne(queryBuilder: SelectQueryBuilder<Task>): void {
    queryBuilder.leftJoinAndSelect(this.p('items'), 'items').leftJoinAndSelect(this.p('message'), 'message');
  }

  protected applyCustomFilters(
    queryBuilder: SelectQueryBuilder<Task>,
    { status, priority, dueDateFrom, dueDateTo, assigneeIds }: QueryDto,
  ): void {
    status && queryBuilder.andWhere({ status });
    priority && queryBuilder.andWhere({ priority });
    dueDateFrom && queryBuilder.andWhere('task.due >= :dueDateFrom', { dueDateFrom });
    dueDateTo && queryBuilder.andWhere('task.due <= :dueDateTo', { dueDateTo });
    assigneeIds && queryBuilder.andWhere({ assigners: In(assigneeIds) });
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
}
