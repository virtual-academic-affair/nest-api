import { IsOptional, IsString } from 'class-validator';
import { EmailLabel } from '@email/enums/email-label.enum';

export class EmailLabelsDto {
  @IsOptional()
  @IsString()
  [EmailLabel.ClassRegistration]?: string | null;

  @IsOptional()
  @IsString()
  [EmailLabel.Training]?: string | null;

  @IsOptional()
  @IsString()
  [EmailLabel.Graduation]?: string | null;

  @IsOptional()
  @IsString()
  'parent'?: string | null;
}
