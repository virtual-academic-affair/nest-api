import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContainedBy, Repository, SelectQueryBuilder } from 'typeorm';
import { QueryDto } from '@email/dtos/messages/query.dto';
import { Message } from '@email/entities/message.entity';
import { ResourceService } from '@shared/resource/services/resource.service';

@Injectable()
export class MessagesService extends ResourceService<Message> {
  protected searchableColumns = ['subject', 'senderEmail', 'senderName'];
  protected orderableColumns = ['sentAt'];

  constructor(@InjectRepository(Message) repository: Repository<Message>) {
    super(repository);
  }

  protected applyCustomFilters(queryBuilder: SelectQueryBuilder<Message>, { systemLabels }: QueryDto): void {
    console.log(systemLabels);
    systemLabels && queryBuilder.andWhere({ systemLabels: ArrayContainedBy(systemLabels) });
  }
}
