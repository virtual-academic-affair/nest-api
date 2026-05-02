import { IsEmail } from 'class-validator';

export class GmailExtensionSessionDto {
  @IsEmail()
  email: string;
}
