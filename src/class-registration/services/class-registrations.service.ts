import { CreateDto, QueryDto } from '@class-registration/dtos/class-registrations/resource.dto';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { ClassRegistrationItemsService } from '@class-registration/services/class-registration-items.service';
import { EmailLabel } from '@email/enums/email-label.enum';
import { MessageStatus } from '@email/enums/message-status.enum';
import { EmailReplyService } from '@email/services/email-send/email-reply.service';
import { MessageLabelsService } from '@email/services/message-labels.service';
import { ClassRegistrationTemplate } from '@email/templates/class-registration.template';
import { Body, ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { applyMessageFilters } from '@email/dtos/messages/message-resource-query.dto';
import { ResourceService } from '@shared/resource/services/resource.service';
import { Repository, SelectQueryBuilder } from 'typeorm';

@Injectable()
export class ClassRegistrationsService extends ResourceService<ClassRegistration> {
  protected searchableColumns: string[] = [];
  protected orderableColumns: string[] = [];

  constructor(
    @InjectRepository(ClassRegistration) repository: Repository<ClassRegistration>,
    private readonly classRegistrationItemsService: ClassRegistrationItemsService,
    private readonly configService: ConfigService,
    private readonly emailReplyService: EmailReplyService,
    private readonly messageLabelsService: MessageLabelsService,
  ) {
    super(repository);
  }

  protected withAll(queryBuilder: SelectQueryBuilder<ClassRegistration>): void {
    queryBuilder.loadRelationCountAndMap(this.p('itemsCount'), this.p('items'));
  }

  protected withOne(queryBuilder: SelectQueryBuilder<ClassRegistration>): void {
    queryBuilder.leftJoinAndSelect(this.p('items'), 'items').leftJoinAndSelect(this.p('message'), 'message');
  }

  protected applyCustomFilters(
    queryBuilder: SelectQueryBuilder<ClassRegistration>,
    { studentCode, cohort, smartOrder, messageId, messageStatuses }: QueryDto,
  ): void {
    applyMessageFilters(queryBuilder, { messageId, messageStatuses });
    const requiresMessageJoin = Boolean(studentCode || cohort || smartOrder);
    requiresMessageJoin && queryBuilder.leftJoin(this.p('message'), 'message');
    studentCode &&
      queryBuilder.andWhere(`message.studentInfo ->> 'studentCode' = :studentCode`, {
        studentCode,
      });
    cohort &&
      queryBuilder.andWhere(`CAST(message.studentInfo ->> 'cohort' AS INTEGER) = :cohort`, {
        cohort,
      });

    if (smartOrder) {
      queryBuilder
        .leftJoin(this.p('items'), 'items')
        .orderBy(`CAST(message.studentInfo ->> 'cohort' AS INTEGER)`, 'ASC', 'NULLS LAST')
        .addOrderBy('items.isInCurriculum', 'DESC')
        .addOrderBy(`COALESCE(message.sentAt, ${this.p('createdAt')})`, 'ASC');
    }
  }

  async create(@Body() dto: CreateDto) {
    const existing = await this.repository.findOneBy({ messageId: dto.messageId });
    throwIf(existing, new ConflictException('Registration already exists'));
    await this.messageLabelsService.run(dto.messageId, null, false, [EmailLabel.ClassRegistration]);
    return await super.create(dto);
  }

  async stats(startDate: Date, endDate: Date) {
    return this.classRegistrationItemsService.stats(startDate, endDate);
  }

  async previewReply(id: number) {
    const classRegistration = await this.findOne(id);
    const template = new ClassRegistrationTemplate(this.configService, classRegistration);
    return { content: template.generate() };
  }

  async sendReply(id: number) {
    const registration = await this.findOne(id);
    const message = registration.message;
    throwUnless(message, new ConflictException('Registration has no message'));

    const content = await this.previewReply(id).then((res) => res.content);
    const sentMessageId = await this.emailReplyService.reply(message, content);
    await this.update(id, { messageStatus: MessageStatus.Replied });

    return sentMessageId;
  }
}
