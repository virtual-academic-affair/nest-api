import { IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';
import { SystemLabel } from '@shared/enums/system-label.enum';

export class UpdateMessageLabelDto {
  @IsBoolean()
  @IsNotEmpty()
  isRemove: boolean;

  @IsEnum(SystemLabel)
  @IsNotEmpty()
  systemLabel!: SystemLabel;
}
