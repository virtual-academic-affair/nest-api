import { PartialType } from '@nestjs/swagger';
import { HasMessageIdDto } from '@email/dtos/messages/has-message-id.dto';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { TaskPriority } from '@task/enums/task-priority.enum';
import { TaskStatus } from '@task/enums/task-status.enum';
import { CreateTaskAssigneeDto } from '@task/dtos/assignees/create-task-assignee.dto';

export class CreateDto extends PartialType(HasMessageIdDto) {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assigners?: string[];

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  deadline?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  assignedAt?: Date;



  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskAssigneeDto)
  @IsOptional()
  taskAssignees?: CreateTaskAssigneeDto[];
}
