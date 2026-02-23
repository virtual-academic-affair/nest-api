import { IsBoolean, IsDefined, IsEnum, IsOptional, IsString } from 'class-validator';
import { RegistrationAction } from '@class-registration/enums/registration-action.enum';

export class CreateDto {
  @IsDefined()
  @IsEnum(RegistrationAction)
  action: RegistrationAction;

  @IsDefined()
  @IsString()
  subjectName: string;

  @IsOptional()
  @IsString()
  className: string;

  @IsOptional()
  @IsString()
  subjectCode: string;

  @IsOptional()
  @IsString()
  slotInfo: string;

  @IsOptional()
  @IsBoolean()
  isInCurriculum: boolean;
}
