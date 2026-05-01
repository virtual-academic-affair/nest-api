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
    this.withAll(queryBuilder);
    queryBuilder.addSelect(this.p('content'));
  }

  protected applyCustomFilters(
    queryBuilder: SelectQueryBuilder<Message>,
    { gmailMessageId, threadId }: QueryDto,
  ): void {
    gmailMessageId && queryBuilder.andWhere({ gmailMessageId });
    threadId && queryBuilder.andWhere({ threadId });
  }
}
