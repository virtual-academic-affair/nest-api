import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { BelongsToMessageCreateDto, BelongsToMessageQueryDto } from '@email/dtos/messages/related-message.dto';
import { InquiryType } from '@inquiry/enums/inquiry-type.enum';

export class QueryDto extends BelongsToMessageQueryDto {
  @IsEnum(InquiryType, { each: true })
  @IsOptional()
  types?: InquiryType[];
}

export class CreateDto extends BelongsToMessageCreateDto {
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
