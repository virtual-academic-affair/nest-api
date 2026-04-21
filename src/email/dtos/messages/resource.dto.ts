import { ArrayUnique, IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { EmailLabel } from '@email/enums/email-label.enum';
import { ResourceQueryDto } from '@shared/resource/dtos/resource-query.dto';

export class QueryDto extends ResourceQueryDto {
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(EmailLabel, { each: true })
  systemLabels?: EmailLabel[];

  @IsOptional()
  @IsString()
  gmailMessageId?: string;

  @IsOptional()
  @IsString()
  threadId?: string;
}

export const ResourceDto = {
  query: QueryDto,
};
