import { PartialType } from '@nestjs/mapped-types';
import { IsDefined, IsEnum, IsOptional, IsString } from 'class-validator';
import { RegistrationAction } from '@class-registration/enums/registration-action.enum';
import { RegistrationStatus } from '@class-registration/enums/registration-status.enum';
import { Upper } from '@shared/decorators/upper.decorator';

export class CreateDto {
  @IsDefined()
  @IsEnum(RegistrationAction)
  action: RegistrationAction;

  @IsDefined()
  @IsString()
  @Upper()
  subjectName: string;

  @IsOptional()
  @IsString()
  @Upper()
  className?: string;

  @IsOptional()
  @IsString()
  @Upper()
  subjectCode?: string;
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
