import { Type } from 'class-transformer';
import { IsDateString, IsDefined, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
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
}

const MSG_SENT_ALIAS = 'vaa_msg_sent_range';

export function applyMessageFilters<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  { messageId, messageStatuses, sentFrom, sentTo }: BelongsToMessageQueryDto,
  via?: string,
): void {
  const mainAlias = queryBuilder.expressionMap.mainAlias!.name;
  const nest = (leaf: ObjectLiteral): ObjectLiteral => (via ? ({ [via]: leaf } as ObjectLiteral) : leaf);

  messageId && queryBuilder.andWhere(nest({ messageId }) as ObjectLiteral);
  messageStatuses?.length && queryBuilder.andWhere(nest({ messageStatus: In(messageStatuses) }) as ObjectLiteral);

  const sentFromDate = sentFrom != null ? new Date(sentFrom) : undefined;
  const sentToDate = sentTo != null ? new Date(sentTo) : undefined;
  if (sentFromDate || sentToDate) {
    via
      ? queryBuilder.innerJoin(`${mainAlias}.${via}`, 'vaa_parent').innerJoin(`vaa_parent.message`, MSG_SENT_ALIAS)
      : queryBuilder.innerJoin(`${mainAlias}.message`, MSG_SENT_ALIAS);
    sentFromDate && queryBuilder.andWhere(`${MSG_SENT_ALIAS}.sentAt >= :vaaSentFrom`, { vaaSentFrom: sentFromDate });
    sentToDate && queryBuilder.andWhere(`${MSG_SENT_ALIAS}.sentAt <= :vaaSentTo`, { vaaSentTo: sentToDate });
  }
}
