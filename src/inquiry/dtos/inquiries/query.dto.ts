import { IsEnum, IsOptional } from 'class-validator';
import { InquiryType } from '@inquiry/enums/inquiry-type.enum';
import { MessageResourceQueryDto } from '@shared/resource/dtos/message-resource-query.dto';

export class QueryDto extends MessageResourceQueryDto {
  @IsEnum(InquiryType, { each: true })
  @IsOptional()
  types?: InquiryType[];
}
