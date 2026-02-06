import {
  IsDefined,
  IsString,
  IsInt,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsBoolean,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RegistrationAction } from '@class-registration/enums/registration-action.enum';

export class CreateRegistrationItemDto {
  @IsDefined()
  @IsEnum(RegistrationAction)
  action!: RegistrationAction;

  @IsDefined()
  @IsString()
  subjectName!: string;

  @IsOptional()
  @IsString()
  className?: string;

  @IsOptional()
  @IsString()
  subjectCode?: string;

  @IsOptional()
  @IsString()
  slotInfo?: string;

  @IsOptional()
  @IsBoolean()
  isInCurriculum?: boolean;
}

export class CreateClassRegistrationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  messageId?: number; // Liên kết với Message.id

  @IsDefined()
  @IsString()
  studentCode!: string; // MSSV

  @IsDefined()
  @IsInt()
  @Type(() => Number)
  academicYear!: number; // Khóa học

  @IsOptional()
  @IsString()
  studentName?: string; // Tên sinh viên

  @IsDefined()
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one item is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateRegistrationItemDto)
  items!: CreateRegistrationItemDto[];
}
