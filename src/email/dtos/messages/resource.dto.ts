import { IsOptional, IsString } from 'class-validator';
import { ResourceQueryDto } from '@shared/resource/dtos/resource-query.dto';

export class QueryDto extends ResourceQueryDto {
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
