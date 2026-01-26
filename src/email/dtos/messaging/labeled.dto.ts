import {
  ArrayUnique,
  IsArray,
  IsDefined,
  IsEnum,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SystemLabel } from '@shared/enums/system-label.enum';

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

export class LabeledDto extends NlpDto {
  @IsDefined()
  @IsArray()
  @ArrayUnique()
  @IsEnum(SystemLabel, { each: true })
  labels!: SystemLabel[];
}
