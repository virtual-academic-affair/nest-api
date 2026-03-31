import { IsString } from 'class-validator';

export class ReferenceMaterialDto {
  @IsString()
  fileId: string;

  @IsString()
  displayName: string;

  @IsString()
  text: string;
}
