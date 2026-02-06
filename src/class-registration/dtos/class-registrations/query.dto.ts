import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ResourceQueryDto } from '@shared/resource/dtos/resource-query.dto';
import { RegistrationStatus } from '@class-registration/enums/registration-status.enum';
import { RegistrationAction } from '@class-registration/enums/registration-action.enum';

export class QueryDto extends ResourceQueryDto {
  @IsOptional()
  @IsString()
  studentCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  academicYear?: number;

  @IsOptional()
  @IsEnum(RegistrationStatus)
  status?: RegistrationStatus;

  @IsOptional()
  @IsEnum(RegistrationAction)
  action?: RegistrationAction;

  @IsOptional()
  @IsString()
  orderBy?: 'priority' | string;
}
