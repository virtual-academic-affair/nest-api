import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  redirectUrl?: string;
}
