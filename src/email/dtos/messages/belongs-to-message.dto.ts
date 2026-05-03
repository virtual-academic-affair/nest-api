import { Type } from 'class-transformer';
import { IsDateString, IsDefined, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { In, LessThanOrEqual, MoreThanOrEqual, ObjectLiteral, SelectQueryBuilder } from 'typeorm';
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
}

export function applyMessageFilters<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  { messageId, messageStatuses, sentFrom, sentTo }: BelongsToMessageQueryDto,
): void {
  messageId && queryBuilder.andWhere({ messageId } as ObjectLiteral);
  messageStatuses?.length && queryBuilder.andWhere({ messageStatus: In(messageStatuses) } as ObjectLiteral);

  // Handle date filters
  const sentFromDate = sentFrom != null ? new Date(sentFrom) : undefined;
  const sentToDate = sentTo != null ? new Date(sentTo) : undefined;
  const mainAlias = queryBuilder.expressionMap.mainAlias!.name;
  (sentFromDate || sentToDate) && queryBuilder.innerJoin(`${mainAlias}.message`, 'vaa_msg_sent_range');
  sentFromDate && queryBuilder.andWhere({ message: { sentAt: MoreThanOrEqual(sentFromDate) } } as ObjectLiteral);
  sentToDate && queryBuilder.andWhere({ message: { sentAt: LessThanOrEqual(sentToDate) } } as ObjectLiteral);
}
