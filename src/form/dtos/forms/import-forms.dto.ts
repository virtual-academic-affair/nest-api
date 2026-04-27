import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class ImportFormsDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  documentTypeCol?: number = 1;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  contentLinkCol?: number = 2;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  startRow?: number = 2;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  linkDisplayNameCol?: number = 3;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  notesCol?: number = 4;
}
