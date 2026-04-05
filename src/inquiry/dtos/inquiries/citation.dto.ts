import { IsString } from 'class-validator';

export class CitationDto {
  @IsString()
  fileId: string;

  @IsString()
  displayName: string;

  @IsString()
  text: string;
}
