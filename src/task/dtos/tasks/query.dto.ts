import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional } from 'class-validator';
import { MessageResourceQueryDto } from '@shared/resource/dtos/message-resource-query.dto';
import { TaskPriority } from '@task/enums/task-priority.enum';
import { TaskStatus } from '@task/enums/task-status.enum';

export class QueryDto extends MessageResourceQueryDto {
  @IsEnum(TaskStatus, { each: true })
  @IsOptional()
  statuses?: TaskStatus[];

  @IsEnum(TaskPriority, { each: true })
  @IsOptional()
  priorities?: TaskPriority[];

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
