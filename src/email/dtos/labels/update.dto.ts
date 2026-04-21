import { EmailLabel } from '@email/enums/email-label.enum';
import { IsOptional, IsString } from 'class-validator';

export class UpdateDto {
  @IsOptional()
  @IsString()
  [EmailLabel.ClassRegistration]?: string | null;

  @IsOptional()
  @IsString()
  [EmailLabel.Training]?: string | null;

  @IsOptional()
  @IsString()
  [EmailLabel.Graduation]?: string | null;
}
