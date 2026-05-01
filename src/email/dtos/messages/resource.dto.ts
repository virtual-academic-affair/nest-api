import { IsOptional, IsString } from 'class-validator';
import { IsBooleanQuery } from '@shared/decorators/is-boolean-query.decorator';
import { ResourceQueryDto } from '@shared/resource/dtos/resource-query.dto';

export class QueryDto extends ResourceQueryDto {
  @IsOptional()
  @IsString()
  gmailMessageId?: string;

  @IsOptional()
  @IsString()
  threadId?: string;

  @IsOptional()
  @IsBooleanQuery()
  threadView?: boolean;
}

export const ResourceDto = {
  query: QueryDto,
};
