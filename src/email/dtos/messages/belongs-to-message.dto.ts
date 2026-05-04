import { Type } from 'class-transformer';
import { IsDateString, IsDefined, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { In, ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { MessageStatus } from '@email/enums/belongs-to-message-status.enum';
import { ResourceQueryDto } from '@shared/resource/dtos/resource-query.dto';

export class BelongsToMessageCreateDto {
  @IsOptional()
  @IsEnum(MessageStatus)
  messageStatus?: MessageStatus;

  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  messageId!: number;
}

export class BelongsToMessageQueryDto extends ResourceQueryDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  messageId?: number;

  @IsEnum(MessageStatus, { each: true })
  @IsOptional()
  messageStatuses?: MessageStatus[];

  @IsOptional()
  @IsDateString()
  sentFrom?: string;

  @IsOptional()
  @IsDateString()
  sentTo?: string;

  /** Lọc theo thread Gmail (cột `thread_id` của bảng message). */
  @IsOptional()
  @IsString()
  threadId?: string;
}

export function applyMessageFilters<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  { messageId, messageStatuses, sentFrom, sentTo, threadId }: BelongsToMessageQueryDto,
  via?: string,
): void {
  const mainAlias = queryBuilder.expressionMap.mainAlias!.name;
  const TARGET_ALIAS = via ? 'msg_relation' : mainAlias;
  const MSG_DETAIL_ALIAS = 'msg_detail';

  via && queryBuilder.innerJoin(`${mainAlias}.${via}`, TARGET_ALIAS);

  messageId && queryBuilder.andWhere(`${TARGET_ALIAS}.messageId = :messageId`, { messageId });
  messageStatuses?.length &&
    queryBuilder.andWhere(`${TARGET_ALIAS}.messageStatus IN (:...messageStatuses)`, { messageStatuses });

  const sentFromDate = sentFrom != null ? new Date(sentFrom) : undefined;
  const sentToDate = sentTo != null ? new Date(sentTo) : undefined;
  const threadIdNorm = threadId?.trim();

  const needMessageJoin = !!(threadIdNorm || sentFromDate || sentToDate);
  if (needMessageJoin) {
    queryBuilder.innerJoin(`${TARGET_ALIAS}.message`, MSG_DETAIL_ALIAS);
  }
  if (threadIdNorm) {
    queryBuilder.andWhere(`${MSG_DETAIL_ALIAS}.threadId = :vaaThreadId`, { vaaThreadId: threadIdNorm });
  }
  if (sentFromDate) {
    queryBuilder.andWhere(`${MSG_DETAIL_ALIAS}.sentAt >= :vaaSentFrom`, { vaaSentFrom: sentFromDate });
  }
  if (sentToDate) {
    queryBuilder.andWhere(`${MSG_DETAIL_ALIAS}.sentAt <= :vaaSentTo`, { vaaSentTo: sentToDate });
  }
}
