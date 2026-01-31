import { IsString } from 'class-validator';

export class CreateCancelReasonDto {
  @IsString()
  reasonText!: string;
}
