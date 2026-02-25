import { IsOptional, IsString } from 'class-validator';

export class ReplyDto {
  @IsOptional()
  @IsString()
  content?: string;
}
