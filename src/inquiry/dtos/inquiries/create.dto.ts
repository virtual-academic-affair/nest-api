import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { HasMessageIdDto } from '@email/dtos/messages/has-message-id.dto';
import { CitationDto } from '@inquiry/dtos/inquiries/citation.dto';
import { InquiryType } from '@inquiry/enums/inquiry-type.enum';

export class CreateDto extends HasMessageIdDto {
  @IsArray()
  @IsOptional()
  @IsEnum(InquiryType, { each: true })
  types?: InquiryType[];

  @IsString()
  @MaxLength(5000)
  question!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  answer?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CitationDto)
  citations?: CitationDto[];
}
