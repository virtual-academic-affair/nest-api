import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class StudentRowDto {
  @IsString()
  studentCode: string;

  @IsString()
  studentName: string;
}

export class ImportStudentsDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  studentCodeCol?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  studentNameCol?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  startRow?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => StudentRowDto)
  students?: StudentRowDto[];
}
