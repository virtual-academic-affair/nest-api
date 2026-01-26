import {
  IsDefined,
  IsEnum,
  IsNumber,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SystemLabel } from '@shared/enums/system-label.enum';

export class NlpProcessedInternalDto {
  @IsDefined()
  @IsNumber()
  id!: number;

  @IsDefined()
  @IsString()
  gmailMessageId!: string;
}

/**
 * DTO for NLP-processed email messages.
 * Contains both classification label and extracted business data.
 */
export class NlpProcessedDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => NlpProcessedInternalDto)
  internal!: NlpProcessedInternalDto;

  @IsDefined()
  @IsEnum(SystemLabel)
  systemLabel!: SystemLabel;

  /**
   * Business data extracted from the email.
   * Structure depends on the systemLabel:
   * - classRegistration: { studentId, studentName, courseCode, courseName, ... }
   * - task: { taskType, deadline, department, ... }
   * - inquiry: { inquiryType, urgency, ... }
   * - other: { ... }
   */
  @IsDefined()
  @IsObject()
  businessData!: Record<string, any>;
}
