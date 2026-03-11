import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReplyDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @IsOptional()
  @IsBoolean()
  isClose?: boolean;
}
