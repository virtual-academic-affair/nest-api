import { Body, ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CreateDto } from '@class-registration/dtos/class-registrations/create.dto';
import { QueryDto } from '@class-registration/dtos/class-registrations/query.dto';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { ClassRegistrationItemsService } from '@class-registration/services/class-registration-items.service';
import { ClassRegistrationTemplate } from '@class-registration/templates/class-registration.template';
import { MessageStatus } from '@email/enums/message-status.enum';
import { EmailReplyService } from '@email/services/email-send/email-reply.service';
import { MessageLabelsService } from '@email/services/message-labels.service';
import { SystemLabel } from '@shared/enums/system-label.enum';
import { applyMessageFilters } from '@shared/resource/dtos/message-resource-query.dto';
import { ResourceService } from '@shared/resource/services/resource.service';

@Injectable()
export class ClassRegistrationsService extends ResourceService<ClassRegistration> {
  protected searchableColumns = ['studentCode', 'studentName'];
  protected orderableColumns = ['academicYear'];

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
    { studentCode, academicYear, smartOrder, messageId, messageStatuses }: QueryDto,
  ): void {
    applyMessageFilters(queryBuilder, { messageId, messageStatuses });
    studentCode && queryBuilder.andWhere({ studentCode });
    academicYear && queryBuilder.andWhere({ academicYear });

    if (smartOrder) {
      queryBuilder
        .leftJoin(this.p('items'), 'items')
        .leftJoin(this.p('message'), 'message')
        .orderBy(this.p('academicYear'), 'ASC')
        .addOrderBy('items.isInCurriculum', 'DESC')
        .addOrderBy(`COALESCE(message.sentAt, ${this.p('createdAt')})`, 'ASC');
    }
  }

  async create(@Body() dto: CreateDto) {
    const existing = dto?.messageId && (await this.repository.findOneBy({ messageId: dto.messageId }));
    throwIf(existing, new ConflictException('Registration already exists'));
    await this.messageLabelsService.run(dto.messageId, null, false, [SystemLabel.ClassRegistration]);
    return await super.create(dto);
  }

  async stats(startDate: Date, endDate: Date, isDetail?: boolean) {
    if (isDetail) {
      return this.classRegistrationItemsService.stats(startDate, endDate);
    }

    const stats = await this.queryBuilder
      .select([`DATE(${this.p('createdAt')}) AS date`, 'COUNT(*) AS total'])
      .where(`${this.p('createdAt')} BETWEEN :startDate AND :endDate`, { startDate, endDate })
      .groupBy(`DATE(${this.p('createdAt')})`)
      .orderBy('date', 'ASC')
      .getRawMany();

    return stats.reduce((acc, { date, total }) => {
      acc[new Date(date).toISOString()] = +total;
      return acc;
    }, {});
  }

  async previewReply(id: number) {
    const classRegistration = await this.findOne(id);
    const template = new ClassRegistrationTemplate(this.configService, classRegistration);
    return { content: template.generate() };
  }

  async sendReply(id: number, content?: string, isClose = false) {
    const registration = await this.findOne(id);
    const message = registration.message;
    throwUnless(message, new ConflictException('Registration has no message'));

    content ??= await this.previewReply(id).then((res) => res.content);
    const sentMessageId = await this.emailReplyService.reply(message, content);
    await this.update(id, { messageStatus: isClose ? MessageStatus.Closed : MessageStatus.Replied });

    return sentMessageId;
  }
}
