import { IsArray, IsString } from 'class-validator';

export class SettingsQueryDto {
  @IsArray()
  @IsString({ each: true })
  keys: string[];
}
