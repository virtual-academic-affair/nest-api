import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { HasMessageIdDto } from '@email/dtos/messages/has-message-id.dto';
import { MessageResourceQueryDto } from '@email/dtos/messages/message-resource-query.dto';
import { InquiryType } from '@inquiry/enums/inquiry-type.enum';

export class QueryDto extends MessageResourceQueryDto {
  @IsEnum(InquiryType, { each: true })
  @IsOptional()
  types?: InquiryType[];
}

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
}

export class UpdateDto extends PartialType(OmitType(CreateDto, ['messageId'] as const)) {}

export const ResourceDto = {
  query: QueryDto,
  create: CreateDto,
  update: UpdateDto,
};
