import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDto {
  @IsString()
  name: string;

  @IsNumber()
  @IsOptional()
  assigneeId?: number;

  @IsString()
  @IsOptional()
  note?: string;
}
