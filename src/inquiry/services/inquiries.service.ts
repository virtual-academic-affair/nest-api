import { Body, ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { MessageStatus } from '@email/enums/message-status.enum';
import { EmailReplyService } from '@email/services/email-send/email-reply.service';
import { MessageLabelsService } from '@email/services/message-labels.service';
import { CreateDto } from '@inquiry/dtos/inquiries/create.dto';
import { QueryDto } from '@inquiry/dtos/inquiries/query.dto';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
import { InquiryType } from '@inquiry/enums/inquiry-type.enum';
import { InquiryTemplate } from '@inquiry/templates/inquiry.template';
import { SystemLabel } from '@shared/enums/system-label.enum';
import { applyMessageFilters } from '@shared/resource/dtos/message-resource-query.dto';
import { ResourceService } from '@shared/resource/services/resource.service';

@Injectable()
export class InquiriesService extends ResourceService<Inquiry> {
  constructor(
    @InjectRepository(Inquiry) repository: Repository<Inquiry>,
    private readonly emailReplyService: EmailReplyService,
    private readonly configService: ConfigService,
    private readonly messageLabelsService: MessageLabelsService,
  ) {
    super(repository);
  }

  protected applyCustomFilters(
    queryBuilder: SelectQueryBuilder<Inquiry>,
    { messageId, messageStatuses, types }: QueryDto,
  ): void {
    applyMessageFilters(queryBuilder, { messageId, messageStatuses });
    types?.length &&
      queryBuilder.andWhere(`${this.p('types')} && ARRAY[:...types]::"inquiry_inquiry_types_enum"[]`, { types });
  }

  async create(@Body() dto: CreateDto) {
    const existing = await this.repository.findOneBy({ messageId: dto.messageId });
    throwIf(existing, new ConflictException('Inquiry already exists'));
    await this.messageLabelsService.run(dto.messageId, null, false, [SystemLabel.Inquiry]);
    return await super.create(dto);
  }

  protected withOne(queryBuilder: SelectQueryBuilder<Inquiry>): void {
    queryBuilder.leftJoinAndSelect(this.p('message'), 'message');
  }

  async stats(startDate: Date, endDate: Date) {
    const alias = this.queryBuilder.alias;
    const stats = await this.queryBuilder
      .select([
        `DATE(${this.p('createdAt')}) AS date`,
        'COUNT(*) AS total',
        `SUM(CASE WHEN '${InquiryType.Graduation}' = ANY("${alias}"."types"::text[]) THEN 1 ELSE 0 END) AS graduation`,
        `SUM(CASE WHEN '${InquiryType.Training}' = ANY("${alias}"."types"::text[]) THEN 1 ELSE 0 END) AS training`,
        `SUM(CASE WHEN '${InquiryType.Procedure}' = ANY("${alias}"."types"::text[]) THEN 1 ELSE 0 END) AS procedure`,
      ])
      .where(`${this.p('createdAt')} BETWEEN :startDate AND :endDate`, { startDate, endDate })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return stats.reduce((acc, row) => {
      acc[new Date(row.date).toISOString()] = {
        total: +row.total,
        types: {
          [InquiryType.Graduation]: +row.graduation,
          [InquiryType.Training]: +row.training,
          [InquiryType.Procedure]: +row.procedure,
        },
      };
      return acc;
    }, {});
  }

  async previewReply(id: number) {
    const inquiry = await this.findOne(id);
    const template = new InquiryTemplate(this.configService, inquiry);
    return { content: template.generate() };
  }

  async sendReply(id: number, content?: string, isClose = false) {
    const inquiry = await this.findOne(id);
    const message = inquiry.message;
    throwUnless(message, new ConflictException('Inquiry has no message'));

    content ??= await this.previewReply(id).then((res) => res.content);
    throwUnless(content, new ConflictException('Reply content is required'));

    const sentMessageId = await this.emailReplyService.reply(message, content);
    await this.update(id, {
      answer: content,
      messageStatus: isClose ? MessageStatus.Closed : MessageStatus.Replied,
    });

    return sentMessageId;
  }
}
