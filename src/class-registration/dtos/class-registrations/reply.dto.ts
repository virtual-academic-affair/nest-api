import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ReplyDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsBoolean()
  isClose?: boolean;
}
