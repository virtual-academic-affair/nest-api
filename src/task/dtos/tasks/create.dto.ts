import { PartialType } from '@nestjs/swagger';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';
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
}
