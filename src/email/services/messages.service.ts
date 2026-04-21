import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayOverlap, Repository, SelectQueryBuilder } from 'typeorm';
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

  protected withAll(queryBuilder: SelectQueryBuilder<Message>) {
    queryBuilder
      .loadRelationIdAndMap(this.p('inquiryIds'), this.p('inquiry'))
      .loadRelationIdAndMap(this.p('classRegistrationIds'), this.p('classRegistration'));
  }

  protected applyCustomFilters(
    queryBuilder: SelectQueryBuilder<Message>,
    { systemLabels, gmailMessageId, threadId }: QueryDto,
  ): void {
    systemLabels?.length && queryBuilder.andWhere({ systemLabels: ArrayOverlap(systemLabels) });
    gmailMessageId && queryBuilder.andWhere({ gmailMessageId });
    threadId && queryBuilder.andWhere({ threadId });
  }

  async removeMessage(id: number) {
    return await this.remove(id);
  }
}
