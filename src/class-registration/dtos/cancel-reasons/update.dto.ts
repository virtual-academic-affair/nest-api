import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateDto {
  @IsOptional()
  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  isActive: boolean;
}
