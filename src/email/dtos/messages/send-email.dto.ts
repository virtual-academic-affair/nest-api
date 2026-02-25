import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class SendEmailDto {
  @IsEmail()
  to!: string;

  @IsString()
  @MaxLength(500)
  subject!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  senderName?: string;

  @IsOptional()
  @IsString()
  threadId?: string;

  @IsOptional()
  @IsString()
  messageId?: string;
}
