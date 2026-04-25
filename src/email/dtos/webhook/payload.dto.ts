import { IsEmail, IsInt, Min } from 'class-validator';

export class PayloadDto {
  @IsEmail()
  emailAddress: string;

  @IsInt()
  @Min(1)
  historyId: number;
}
