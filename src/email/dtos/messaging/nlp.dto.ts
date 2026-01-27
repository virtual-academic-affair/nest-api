import { IsDefined, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class InternalDto {
  @IsDefined()
  @IsNumber()
  id!: number;

  @IsDefined()
  @IsString()
  gmailMessageId!: string;
}

export class NlpDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => InternalDto)
  internal!: InternalDto;
}
