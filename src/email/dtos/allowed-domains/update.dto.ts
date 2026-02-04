import { ArrayUnique, IsArray, IsString } from 'class-validator';

export class UpdateAllowedDomainsDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  domains: string[];
}
