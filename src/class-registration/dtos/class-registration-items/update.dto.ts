import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { CreateDto } from '@class-registration/dtos/class-registration-items/create.dto';
import { RegistrationStatus } from '@class-registration/enums/registration-status.enum';

export class UpdateDto extends PartialType(CreateDto) {
  @IsOptional()
  @IsEnum(RegistrationStatus)
  status: RegistrationStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rejectReasons: string[];
}
