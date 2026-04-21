import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayOverlap, DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Message } from '@email/entities/message.entity';
import { MessageStatus } from '@email/enums/message-status.enum';
import { EmailLabel, LabelKey } from '@email/enums/email-label.enum';
import { EmailReplyService } from '@email/services/email-send/email-reply.service';
import { MessageLabelsService } from '@email/services/message-labels.service';
import { CreateDto, QueryDto, UpdateDto } from '@inquiry/dtos/inquiries/resource.dto';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
import { InquiryType } from '@inquiry/enums/inquiry-type.enum';
import { InquiryTemplate } from '@email/templates/inquiry.template';
import { applyMessageFilters } from '@email/dtos/messages/message-resource-query.dto';
import { ResourceService } from '@shared/resource/services/resource.service';

@Injectable()
export class InquiriesService extends ResourceService<Inquiry> {
  constructor(
    @InjectRepository(Inquiry) repository: Repository<Inquiry>,
    private readonly emailReplyService: EmailReplyService,
    private readonly configService: ConfigService,
    private readonly messageLabelsService: MessageLabelsService,
    private readonly dataSource: DataSource,
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
    const typeLabels = (dto.types ?? []) as unknown as LabelKey[];
    await this.messageLabelsService.run(dto.messageId, null, false, typeLabels as unknown as EmailLabel[]);
    dto.types?.length && (await this.syncTypeLabels(dto.messageId, typeLabels, []));
    return await super.create(dto);
  }

  async update(id: number, updateDto: UpdateDto) {
    const { messageId, types: prevTypes = [] } = await this.findOne(id);
    if (updateDto.types !== undefined) {
      const nextTypes = updateDto.types ?? [];
      await this.syncTypeLabels(
        messageId,
        nextTypes.filter((t) => !prevTypes.includes(t)) as LabelKey[],
        prevTypes.filter((t) => !nextTypes.includes(t)) as LabelKey[],
      );
    }
    return await super.update(id, updateDto);
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
    return { content: new InquiryTemplate(this.configService, inquiry).generate() };
  }

  async sendReply(id: number, content?: string) {
    const inquiry = await this.findOne(id);
    const message = inquiry.message;
    throwUnless(message, new ConflictException('Inquiry has no message'));

    content ??= (await this.previewReply(id)).content;
    throwUnless(content, new ConflictException('Reply content is required'));

    const sentMessageId = await this.emailReplyService.reply(message, content);
    await this.update(id, {
      answer: content,
      messageStatus: MessageStatus.Replied,
    });

    return sentMessageId;
  }

  private async syncTypeLabels(messageId: number, toAdd: LabelKey[], toRemove: LabelKey[]): Promise<void> {
    if (toAdd.length === 0 && toRemove.length === 0) {
      return;
    }

    await this.dataSource.transaction(async (manager) => {
      const message = await manager.findOneOrFail(Message, {
        where: { id: messageId },
        lock: { mode: 'pessimistic_write' },
      });
      await this.messageLabelsService.syncGmailLabels(message.gmailMessageId, toAdd, toRemove, manager);
    });
  }
}
