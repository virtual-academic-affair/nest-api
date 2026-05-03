import { IntersectionType, PartialType } from '@nestjs/mapped-types';
import { IsDefined, IsEnum, IsOptional, IsString } from 'class-validator';
import { RegistrationAction } from '@class-registration/enums/registration-action.enum';
import { RegistrationStatus } from '@class-registration/enums/registration-status.enum';
import { BelongsToMessageQueryDto } from '@email/dtos/messages/belongs-to-message.dto';
import { Upper } from '@shared/decorators/upper.decorator';
import { ResourceQueryDto } from '@shared/resource/dtos/resource-query.dto';

export class QueryDto extends IntersectionType(ResourceQueryDto, BelongsToMessageQueryDto) {
  @IsEnum(RegistrationStatus, { each: true })
  @IsOptional()
  statuses?: RegistrationStatus[];

  @IsEnum(RegistrationAction, { each: true })
  @IsOptional()
  actions?: RegistrationAction[];

  @IsOptional()
  @IsString()
  @Upper()
  subjectName?: string;
}

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
  query: QueryDto,
  create: CreateDto,
  update: UpdateDto,
};
