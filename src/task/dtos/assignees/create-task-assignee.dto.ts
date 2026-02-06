import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTaskAssigneeDto {
  @IsNumber()
  @IsOptional()
  id?: number;

  @IsString()
  name: string;

  @IsNumber()
  @IsOptional()
  assigneeId?: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  assignedAt?: Date;
}
