import { RegistrationAction } from '@class-registration/enums/registration-action.enum';
import { RegistrationStatus } from '@class-registration/enums/registration-status.enum';
import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsDefined, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateDto {
  @IsDefined()
  @IsEnum(RegistrationAction)
  action: RegistrationAction;

  @IsDefined()
  @IsString()
  subjectName: string;

  @IsOptional()
  @IsString()
  className?: string;

  @IsOptional()
  @IsString()
  subjectCode?: string;

  @IsOptional()
  @IsBoolean()
  isInCurriculum?: boolean;
}

export class UpdateDto extends PartialType(CreateDto) {
  @IsOptional()
  @IsEnum(RegistrationStatus)
  status: RegistrationStatus;

  @IsOptional()
  @IsString()
  note: string;
}

export const ResourceDto = {
  create: CreateDto,
  update: UpdateDto,
};
