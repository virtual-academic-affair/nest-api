import { IsArray, IsOptional } from 'class-validator';

export class QueryDto {
  @IsOptional()
  @IsArray()
  settings?: string[];

  @IsOptional()
  @IsArray()
  enums?: string[];
}
