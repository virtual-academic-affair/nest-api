import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { StudentsService } from '@authentication/services/students.service';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { QueryDto } from '@email/dtos/messages/resource.dto';
import { Message } from '@email/entities/message.entity';
import { MessageStatus } from '@email/enums/belongs-to-message-status.enum';
import { LabelsService } from '@email/services/labels.service';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
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
  ) {
    super(repository);
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
