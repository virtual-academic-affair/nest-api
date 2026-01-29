import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ResourceService } from '@shared/resource/services/resource.service';
import { QueryDto } from '@email/dtos/messages/query.dto';
import { Message } from '@email/entities/message.entity';

@Injectable()
export class MessagesService extends ResourceService<Message> {
  protected searchableColumns = ['subject', 'senderEmail', 'senderName'];

  protected orderableColumns = ['id', 'sentAt'];

  constructor(@InjectRepository(Message) repository: Repository<Message>) {
    super(repository);
  }

  protected applyCustomFilters(
    queryBuilder: SelectQueryBuilder<Message>,
    queryDto: QueryDto
  ): void {
    const { systemLabels } = queryDto as QueryDto;
    systemLabels &&
      queryBuilder.andWhere(
        `${this.entityName}.systemLabels @> :systemLabels`,
        {
          systemLabels,
        }
      );
  }
}
