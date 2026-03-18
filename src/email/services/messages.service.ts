import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContainedBy, Repository, SelectQueryBuilder } from 'typeorm';
import { QueryDto } from '@email/dtos/messages/query.dto';
import { Message } from '@email/entities/message.entity';
import { ResourceService } from '@shared/resource/services/resource.service';
import { Task } from '@task/entities/task.entity';

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
      .loadRelationCountAndMap(this.p('tasksCount'), this.p('tasks'))
      .loadRelationCountAndMap(this.p('hasInquiry'), this.p('inquiry'))
      .loadRelationCountAndMap(this.p('hasClassRegistration'), this.p('classRegistration'));
  }

  protected applyCustomFilters(queryBuilder: SelectQueryBuilder<Message>, { systemLabels }: QueryDto): void {
    systemLabels && queryBuilder.andWhere({ systemLabels: ArrayContainedBy(systemLabels) });
  }

  async removeMessage(id: number, deleteTasks?: boolean) {
    return await this.repository.manager.transaction(async (manager) => {
      deleteTasks && (await manager.delete(Task, { messageId: id }));
      return this.remove(id);
    });
  }
}
