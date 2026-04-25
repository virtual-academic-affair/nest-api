import { Type } from 'class-transformer';
import { IsDefined, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
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
}

export function applyMessageFilters<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  { messageId, messageStatuses }: BelongsToMessageQueryDto,
): void {
  messageId && queryBuilder.andWhere({ messageId } as ObjectLiteral);
  messageStatuses?.length && queryBuilder.andWhere({ messageStatus: In(messageStatuses) } as ObjectLiteral);
}
