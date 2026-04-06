import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityMetadata, Repository } from 'typeorm';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { MessageStatus } from '@email/enums/message-status.enum';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
import { OpenTodayQueryDto } from '@shared/dtos/dashboard/open-today-query.dto';
import { RedisService } from '@shared/services/redis.service';
import { Task } from '@task/entities/task.entity';
import { TaskStatus } from '@task/enums/task-status.enum';

const DASHBOARD_SUMMARY_TTL_SECONDS = 60;

export interface TodayDashboardSummary {
  classRegistrations: { open: number; totalToday: number };
  tasks: { todo: number; totalToday: number };
  inquiries: { totalToday: number; trainingToday: number; graduationToday: number };
}

@Injectable()
export class DashboardSummaryService {
  private readonly logger = new Logger(DashboardSummaryService.name);

  constructor(
    @InjectRepository(ClassRegistration) private readonly classRegistrationRepository: Repository<ClassRegistration>,
    @InjectRepository(Task) private readonly taskRepository: Repository<Task>,
    @InjectRepository(Inquiry) private readonly inquiryRepository: Repository<Inquiry>,
    private readonly redis: RedisService,
  ) {}

  private cacheKey(from: Date, to: Date): string {
    return `shared:dashboard:today-summary:v4:${from.toISOString()}:${to.toISOString()}`;
  }

  private resolveBounds(query: OpenTodayQueryDto): { from: Date; to: Date } {
    if (query.from && query.to) {
      return { from: query.from, to: query.to };
    }
    const n = new Date();
    const from = new Date(n.getFullYear(), n.getMonth(), n.getDate(), 0, 0, 0, 0);
    const to = new Date(n.getFullYear(), n.getMonth(), n.getDate(), 23, 59, 59, 999);
    return { from, to };
  }

  async getTodaySummary(query: OpenTodayQueryDto): Promise<TodayDashboardSummary> {
    const { from, to } = this.resolveBounds(query);
    const key = this.cacheKey(from, to);

    try {
      const cached = await this.redis.get(key);
      if (cached) {
        return JSON.parse(cached) as TodayDashboardSummary;
      }
    } catch (err) {
      this.logger.warn(`Redis get ${key} failed`, err);
    }

    const summary = await this.computeSummary(from, to);

    this.redis
      .set(key, JSON.stringify(summary), DASHBOARD_SUMMARY_TTL_SECONDS)
      .catch((err) => this.logger.warn(`Redis set failed for key ${key}`, err));
    return summary;
  }

  private async computeSummary(from: Date, to: Date): Promise<TodayDashboardSummary> {
    const opened = MessageStatus.Opened;
    const todo = TaskStatus.Todo;
    const params = [from, to, opened];

    const quote = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
    const getTable = (m: EntityMetadata) =>
      m.schema ? `${quote(m.schema)}.${quote(m.tableName)}` : quote(m.tableName);
    const getCol = (m: EntityMetadata, p: string) => {
      const name = m.findColumnWithPropertyPath(p)?.databaseName;
      throwUnless(name, new Error(`Missing column ${p} on ${m.name}`));
      return quote(name);
    };

    const cr = this.classRegistrationRepository.metadata;
    const tk = this.taskRepository.metadata;
    const iq = this.inquiryRepository.metadata;

    const tCr = getTable(cr);
    const cCrDate = getCol(cr, 'createdAt');
    const cCrMsg = getCol(cr, 'messageStatus');

    const tTk = getTable(tk);
    const cTkDate = getCol(tk, 'createdAt');
    const cTkStatus = getCol(tk, 'status');

    const tIq = getTable(iq);
    const cIqDate = getCol(iq, 'createdAt');
    const cIqTypes = getCol(iq, 'types');

    const sql = `
      SELECT (SELECT COUNT(*) ::int FROM ${tCr} WHERE ${cCrDate} BETWEEN $1 AND $2 AND ${cCrMsg}::text = $3::text) AS cr_open,
        (SELECT COUNT(*)::int FROM ${tCr} WHERE ${cCrDate} BETWEEN $1 AND $2) AS cr_total, (SELECT COUNT (*):: int FROM
             ${tTk} WHERE ${cTkDate} BETWEEN $1 AND $2 AND ${cTkStatus}::text = $4::text) AS task_todo, (SELECT COUNT (*):: int FROM
             ${tTk} WHERE ${cTkDate} BETWEEN $1 AND $2) AS task_total, (SELECT COUNT (*):: int FROM
             ${tIq} WHERE ${cIqDate} BETWEEN $1 AND $2) AS inq_total, (SELECT COUNT (*):: int FROM
             ${tIq} WHERE ${cIqDate} BETWEEN $1 AND $2 AND ${cIqTypes} IS NOT NULL AND 'training' = ANY (${cIqTypes}::text[])) AS inq_training, (SELECT COUNT (*):: int FROM
             ${tIq} WHERE ${cIqDate} BETWEEN $1 AND $2 AND ${cIqTypes} IS NOT NULL AND 'graduation' = ANY (${cIqTypes}::text[])) AS inq_graduation
    `;

    const [row = {}] = await this.classRegistrationRepository.manager.query(sql, [...params, todo]);

    return {
      classRegistrations: {
        open: Number(row.cr_open ?? 0),
        totalToday: Number(row.cr_total ?? 0),
      },
      tasks: {
        todo: Number(row.task_todo ?? 0),
        totalToday: Number(row.task_total ?? 0),
      },
      inquiries: {
        totalToday: Number(row.inq_total ?? 0),
        trainingToday: Number(row.inq_training ?? 0),
        graduationToday: Number(row.inq_graduation ?? 0),
      },
    };
  }
}
