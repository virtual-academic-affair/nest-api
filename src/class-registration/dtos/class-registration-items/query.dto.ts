import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { RegistrationAction } from '@class-registration/enums/registration-action.enum';
import { RegistrationStatus } from '@class-registration/enums/registration-status.enum';
import { ResourceQueryDto } from '@shared/resource/dtos/resource-query.dto';

export class QueryDto extends ResourceQueryDto {
  @IsOptional()
  @IsEnum(RegistrationStatus)
  status: RegistrationStatus;

  @IsOptional()
  @IsEnum(RegistrationAction)
  action: RegistrationAction;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rejectReasons: string[];
}
