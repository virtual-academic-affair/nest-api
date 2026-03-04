import { IsOptional, IsString, MaxLength } from 'class-validator';
import { HasMessageIdDto } from '@email/dtos/messages/has-message-id.dto';

export class CreateDto extends HasMessageIdDto {
  @IsString()
  @MaxLength(5000)
  question!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  answer?: string;
}
