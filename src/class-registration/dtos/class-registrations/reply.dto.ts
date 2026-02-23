import { IsOptional, IsString } from 'class-validator';

export class ReplyDto {
  @IsOptional()
  @IsString()
  greeting?: string;

  @IsOptional()
  @IsString()
  fullBody?: string;
}
