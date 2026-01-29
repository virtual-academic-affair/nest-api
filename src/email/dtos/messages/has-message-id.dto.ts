import { IsDefined, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class HasMessageIdDto {
  @IsDefined()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  messageId!: number;
}
