import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional } from 'class-validator';
import { ResourceQueryDto } from '@shared/resource/dtos/resource-query.dto';
import { TaskPriority } from '@task/enums/task-priority.enum';
import { TaskStatus } from '@task/enums/task-status.enum';

export class QueryDto extends ResourceQueryDto {
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueDateFrom?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  dueDateTo?: Date;

  @IsInt({ each: true })
  @Type(() => Number)
  @IsOptional()
  assigneeIds?: number[];
}
