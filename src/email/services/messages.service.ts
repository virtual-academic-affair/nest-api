import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { QueryDto } from '@email/dtos/messages/query.dto';
import { Message } from '@email/entities/message.entity';
import { ResourceService } from '@shared/resource/services/resource.service';

@Injectable()
export class MessagesService extends ResourceService<Message> {
  protected searchableColumns = ['subject', 'senderEmail', 'senderName'];

  protected orderableColumns = ['id', 'sentAt'];

  constructor(@InjectRepository(Message) repository: Repository<Message>) {
    super(repository);
  }

  protected applyCustomFilters(queryBuilder: SelectQueryBuilder<Message>, { systemLabels }: QueryDto): void {
    systemLabels && queryBuilder.andWhere({ systemLabels: In(systemLabels) });
  }
}
