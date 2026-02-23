import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { RegistrationStatus } from '@class-registration/enums/registration-status.enum';

export class UpdateDto {
  @IsOptional()
  @IsEnum(RegistrationStatus)
  status: RegistrationStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rejectReasons: string[];
}
