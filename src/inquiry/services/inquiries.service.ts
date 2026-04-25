import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayOverlap, Repository, SelectQueryBuilder } from 'typeorm';
import { applyMessageFilters } from '@email/dtos/messages/belongs-to-message.dto';
import { GmailReplyService } from '@email/services/gmail/sending/reply.service';
import { InquiryTemplate } from '@email/templates/inquiry.template';
import { CreateDto, QueryDto } from '@inquiry/dtos/inquiries/resource.dto';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
import { InquiryType } from '@inquiry/enums/inquiry-type.enum';
import { ResourceService } from '@shared/resource/services/resource.service';

@Injectable()
export class InquiriesService extends ResourceService<Inquiry> {
  constructor(
    @InjectRepository(Inquiry) repository: Repository<Inquiry>,
    private readonly gmailReplyService: GmailReplyService,
    private readonly configService: ConfigService,
  ) {
    super(repository);
  }

  protected applyCustomFilters(
    queryBuilder: SelectQueryBuilder<Inquiry>,
    { messageId, messageStatuses, types }: QueryDto,
  ): void {
    applyMessageFilters(queryBuilder, { messageId, messageStatuses });
    types?.length && queryBuilder.andWhere({ types: ArrayOverlap(types) } as any);
  }

  protected withOne(queryBuilder: SelectQueryBuilder<Inquiry>): void {
    queryBuilder.leftJoinAndSelect(this.p('message'), 'message');
  }

  async create(dto: CreateDto) {
    throwIf(
      await this.repository.findOneBy({ messageId: dto.messageId }),
      new ConflictException('Inquiry already exists'),
    );
    return await super.create(dto);
  }

  async stats(startDate: Date, endDate: Date) {
    const alias = this.queryBuilder.alias;
    const stats = await this.queryBuilder
      .select([
        `DATE(${this.p('createdAt')}) AS date`,
        'COUNT(*) AS total',
        `SUM(CASE WHEN '${InquiryType.Graduation}' = ANY("${alias}"."types"::text[]) THEN 1 ELSE 0 END) AS graduation`,
        `SUM(CASE WHEN '${InquiryType.Training}' = ANY("${alias}"."types"::text[]) THEN 1 ELSE 0 END) AS training`,
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
        },
      };
      return acc;
    }, {});
  }

  async previewReply(id: number) {
    const inquiry = await this.findOne(id);
    throwIf(!inquiry.answer, new ConflictException('Inquiry has no answer to preview'));
    return { content: new InquiryTemplate(this.configService, inquiry).generate() };
  }

  async sendReply(id: number) {
    const inquiry = await this.findOne(id);
    const message = inquiry.message;
    throwUnless(message, new ConflictException('Inquiry has no message'));

    await this.gmailReplyService.reply(message, await this.previewReply(id).then((res) => res.content));
  }
}
