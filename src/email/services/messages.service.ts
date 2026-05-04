import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { StudentsService } from '@authentication/services/students.service';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { ClassRegistrationsService } from '@class-registration/services/class-registrations.service';
import { ReplyPluckDto, ReplyPluckEntity } from '@email/dtos/messages/reply-pluck.dto';
import { QueryDto } from '@email/dtos/messages/resource.dto';
import { Message } from '@email/entities/message.entity';
import { MessageStatus } from '@email/enums/belongs-to-message-status.enum';
import { Label } from '@email/enums/label.enum';
import { LabelsService } from '@email/services/labels.service';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
import { InquiriesService } from '@inquiry/services/inquiries.service';
import { ResourceService } from '@shared/resource/services/resource.service';

@Injectable()
export class MessagesService extends ResourceService<Message> {
  private readonly logger = new Logger(MessagesService.name);

  protected searchableColumns = ['subject', 'senderEmail', 'senderName'];

  protected orderableColumns = ['sentAt'];

  constructor(
    @InjectRepository(Message) repository: Repository<Message>,
    private readonly labelsService: LabelsService,
    private readonly studentsService: StudentsService,
    private readonly inquiriesService: InquiriesService,
    private readonly classRegistrationsService: ClassRegistrationsService,
  ) {
    super(repository);
  }

  async replyPluck(dto: ReplyPluckDto) {
    const [inquiryIds, classRegIds] = await Promise.all([
      this.collectAllIds(this.inquiriesService, dto),
      this.collectAllIds(this.classRegistrationsService, dto),
    ]);

    const results = await Promise.all([
      this.processReplies('inquiry', inquiryIds, (id) => this.inquiriesService.sendReply(id)),
      this.processReplies('classRegistration', classRegIds, (id) => this.classRegistrationsService.sendReply(id)),
    ]);

    const [inquiryRes, classRegRes] = results;

    return {
      total: inquiryIds.length + classRegIds.length,
      success: inquiryRes.stats.success + classRegRes.stats.success,
      failed: inquiryRes.stats.failed + classRegRes.stats.failed,
      inquiry: inquiryRes.stats,
      classRegistration: classRegRes.stats,
      failures: [...inquiryRes.failures, ...classRegRes.failures],
    };
  }

  private async collectAllIds<T extends { id: number }>(
    service: { findAll: (params: any) => Promise<{ items: T[]; pagination: { totalPages: number } }> },
    dto: ReplyPluckDto,
  ): Promise<number[]> {
    const limit = 50;
    const baseParams = { ...dto, limit, messageStatuses: [MessageStatus.Staged] };
    const firstPage = await service.findAll({ ...baseParams, page: 1 });
    const totalPages = firstPage.pagination.totalPages;

    if (totalPages <= 1) {
      return firstPage.items.map((item) => item.id);
    }

    const remainingPagesPromises = Array.from({ length: totalPages - 1 }, (_, i) =>
      service.findAll({ ...baseParams, page: i + 2 }),
    );

    const remainingResults = await Promise.all(remainingPagesPromises);
    return [...firstPage.items, ...remainingResults.flatMap((res) => res.items)].map((item) => item.id);
  }

  private async processReplies(type: ReplyPluckEntity, ids: number[], sender: (id: number) => Promise<any>) {
    const chunkSize = 10;
    const failures: any[] = [];
    let success = 0;

    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);

      await Promise.all(
        chunk.map(async (id) => {
          try {
            const message = await sender(id);
            const labels = type === 'classRegistration' ? [Label.ClassRegistration] : (message.inquiry?.types ?? []);
            await this.labelsService.label(message, labels);
            success++;
          } catch (error) {
            failures.push({ type, id, reason: error instanceof Error ? error.message : String(error) });
          }
        }),
      );
    }
    return { stats: { total: ids.length, success, failed: ids.length - success }, failures };
  }

  override async create(createDto: Partial<Message>): Promise<Message> {
    const data = { ...createDto };

    if (data.senderEmail && !data.studentCode) {
      try {
        data.student = await this.studentsService.findByEmail(data.senderEmail);
      } catch (error: any) {
        this.logger.warn(`Failed to detect student for ${data.senderEmail}: ${error?.message ?? error}`);
      }
    }

    return this.repository.manager.transaction(async (manager) => {
      const messageRepository = manager.getRepository(Message);

      const prevMessage = await messageRepository.findOne({
        where: { threadId: data.threadId, isCurrent: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (prevMessage) {
        const messageId = prevMessage.id;
        await Promise.all([
          messageRepository.update({ threadId: data.threadId, isCurrent: true }, { isCurrent: false }),
          manager
            .getRepository(Inquiry)
            .update({ messageId, messageStatus: MessageStatus.Staged }, { messageStatus: MessageStatus.Conflict }),
          manager
            .getRepository(ClassRegistration)
            .update({ messageId, messageStatus: MessageStatus.Staged }, { messageStatus: MessageStatus.Conflict }),
        ]);
      }

      return messageRepository.save(messageRepository.create(data));
    });
  }

  override async remove(id: number): Promise<Message> {
    const entity = await this.findOne(id);

    try {
      await this.labelsService.label(entity, [], ['parent']);
    } catch (error: any) {
      this.logger.warn(`Failed to remove label from message with ID ${id} before deletion. Error: ${error?.message}`);
    }

    return await super.remove(id);
  }

  protected withOne(queryBuilder: SelectQueryBuilder<Message>) {
    queryBuilder
      .leftJoinAndSelect(this.p('inquiry'), 'inquiry')
      .leftJoinAndSelect(this.p('classRegistration'), 'classRegistration')
      .leftJoinAndSelect('classRegistration.items', 'items')
      .leftJoinAndSelect(this.p('student'), 'student')
      .addSelect(this.p('content'));
  }

  protected applyCustomFilters(
    queryBuilder: SelectQueryBuilder<Message>,
    { gmailMessageId, threadId, threadView, hasConflict }: QueryDto,
  ): void {
    gmailMessageId && queryBuilder.andWhere({ gmailMessageId });
    threadId && queryBuilder.andWhere({ threadId });
    threadView && queryBuilder.andWhere({ isCurrent: true });

    if (hasConflict) {
      const conflictEntities = [
        { entity: Inquiry, alias: 'iqc' },
        { entity: ClassRegistration, alias: 'crc' },
      ];

      const existConditions = conflictEntities.map(({ entity, alias }) => {
        const subQuery = queryBuilder
          .subQuery()
          .select('1')
          .from(entity, alias)
          .where(`${alias}.messageId = ${this.alias}.id`)
          .andWhere(`${alias}.messageStatus = '${MessageStatus.Conflict}'`)
          .getQuery();

        return `EXISTS ${subQuery}`;
      });

      queryBuilder.andWhere(`(${existConditions.join(' OR ')})`);
    }
  }
}
