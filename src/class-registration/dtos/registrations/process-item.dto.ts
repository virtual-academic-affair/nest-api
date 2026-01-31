import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RegistrationStatus } from '@class-registration/enums/registration-status.enum';

export class ProcessItemDto {
  @IsEnum(RegistrationStatus)
  status!: RegistrationStatus;

  @IsOptional()
  @IsString()
  rejectReason?: string; // Lý do từ chối (nếu status = REJECTED)
}
