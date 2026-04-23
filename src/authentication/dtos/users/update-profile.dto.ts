import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

export class ProfilePatchDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  enrollmentYear?: number;

  @IsOptional()
  @IsString()
  major?: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfilePatchDto)
  profile?: ProfilePatchDto;
}
