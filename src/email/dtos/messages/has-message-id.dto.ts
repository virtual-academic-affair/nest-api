import { Type } from 'class-transformer';
import { IsDefined, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { MessageStatus } from '@email/enums/message-status.enum';

export class HasMessageIdDto {
  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  messageId!: number;

  @IsOptional()
  @IsEnum(MessageStatus)
  messageStatus!: MessageStatus;
}
