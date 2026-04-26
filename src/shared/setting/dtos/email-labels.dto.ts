import { IsOptional, IsString } from 'class-validator';
import { Label } from '@email/enums/label.enum';

export class LabelsDto {
  @IsOptional()
  @IsString()
  [Label.ClassRegistration]?: string | null;

  @IsOptional()
  @IsString()
  [Label.Training]?: string | null;

  @IsOptional()
  @IsString()
  [Label.Graduation]?: string | null;

  @IsOptional()
  @IsString()
  'parent'?: string | null;
}
