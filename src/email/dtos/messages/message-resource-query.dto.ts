import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { In, ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { MessageStatus } from '@email/enums/message-status.enum';
import { ResourceQueryDto } from '@shared/resource/dtos/resource-query.dto';

export class MessageResourceQueryDto extends ResourceQueryDto {
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
  { messageId, messageStatuses }: MessageResourceQueryDto,
): void {
  messageId && queryBuilder.andWhere({ messageId } as ObjectLiteral);
  messageStatuses?.length && queryBuilder.andWhere({ messageStatus: In(messageStatuses) } as ObjectLiteral);
}

