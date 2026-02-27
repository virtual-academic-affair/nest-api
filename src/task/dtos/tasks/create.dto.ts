import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsArray, IsDate, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { HasMessageIdDto } from '@email/dtos/messages/has-message-id.dto';
import { TaskPriority } from '@task/enums/task-priority.enum';
import { TaskStatus } from '@task/enums/task-status.enum';

export class CreateDto extends PartialType(HasMessageIdDto) {
  @IsOptional()
  @IsString({ each: true })
  assigners?: string[];

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  @IsOptional()
  due?: Date;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  @IsOptional()
  assigneeIds?: number[];
}
