import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { QueryDto } from '@email/dtos/messages/resource.dto';
import { Message } from '@email/entities/message.entity';
import { LabelsService } from '@email/services/labels.service';
import { ResourceService } from '@shared/resource/services/resource.service';

@Injectable()
export class MessagesService extends ResourceService<Message> {
  private readonly logger = new Logger(MessagesService.name);

  protected searchableColumns = ['subject', 'senderEmail', 'senderName'];

  protected orderableColumns = ['sentAt'];

  constructor(
    @InjectRepository(Message) repository: Repository<Message>,
    private readonly labelsService: LabelsService,
  ) {
    super(repository);
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
      .leftJoinAndSelect('inquiry', 'inquiry')
      .leftJoinAndSelect('classRegistration', 'classRegistration')
      .leftJoinAndSelect(this.p('student'), 'student')
      .addSelect(this.p('content'));
  }

  protected withLatestMessagesOnly(queryBuilder: SelectQueryBuilder<Message>) {
    queryBuilder.andWhere(`NOT EXISTS (
      SELECT 1 FROM message m3 
      WHERE m3.threadId = ${this.p('threadId')}
      AND m3.sentAt > ${this.p('sentAt')}
    )`);
  }

  protected withAll(queryBuilder: SelectQueryBuilder<Message>) {
    this.withLatestMessagesOnly(queryBuilder);
  }

  protected applyCustomFilters(
    queryBuilder: SelectQueryBuilder<Message>,
    { gmailMessageId, threadId }: QueryDto,
  ): void {
    gmailMessageId && queryBuilder.andWhere({ gmailMessageId });
    threadId && queryBuilder.andWhere({ threadId });
  }
}
