import { IsOptional, IsString } from 'class-validator';

export class UpdateCancelReasonDto {
  @IsOptional()
  @IsString()
  reasonText?: string;
}
