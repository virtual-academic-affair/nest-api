import { MessageStatus } from '@email/enums/message-status.enum';
import { Type } from 'class-transformer';
import { IsDefined, IsEnum, IsInt, Min } from 'class-validator';

export class HasMessageIdDto {
  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  messageId!: number;

  @IsDefined()
  @IsEnum(MessageStatus)
  messageStatus!: MessageStatus;
}
