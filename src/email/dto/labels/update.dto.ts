import { IsOptional, IsString } from 'class-validator';
import { SystemLabel } from '@shared/enums/system-label.enum';

export class UpdateDto {
  @IsOptional()
  @IsString()
  [SystemLabel.ClassRegistration]?: string | null;

  @IsOptional()
  @IsString()
  [SystemLabel.Inquiry]?: string | null;

  @IsOptional()
  @IsString()
  [SystemLabel.Task]?: string | null;

  @IsOptional()
  @IsString()
  [SystemLabel.Other]?: string | null;
}
