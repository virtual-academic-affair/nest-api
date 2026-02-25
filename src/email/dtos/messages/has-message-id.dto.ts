import { Type } from 'class-transformer';
import { IsDefined, IsInt, Min } from 'class-validator';

export class HasMessageIdDto {
  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  messageId!: number;
}
