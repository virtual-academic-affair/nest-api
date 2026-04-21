import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { EmailLabel } from '@email/enums/email-label.enum';

export class UpdateLabelsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  messageId?: number;

  @IsArray()
  @ArrayUnique()
  @IsEnum(EmailLabel, { each: true })
  systemLabels!: EmailLabel[];
}
