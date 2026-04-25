import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { QueryDto } from '@email/dtos/messages/resource.dto';
import { Message } from '@email/entities/message.entity';
import { ResourceService } from '@shared/resource/services/resource.service';

@Injectable()
export class MessagesService extends ResourceService<Message> {
  protected searchableColumns = ['subject', 'senderEmail', 'senderName'];

  protected orderableColumns = ['sentAt'];

  constructor(@InjectRepository(Message) repository: Repository<Message>) {
    super(repository);
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
