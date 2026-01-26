import { IsBoolean, IsEnum } from 'class-validator';
import { SystemLabel } from '@shared/enums/system-label.enum';

export class UpdateMessageLabelDto {
  @IsBoolean()
  isRemove!: boolean;

  @IsEnum(SystemLabel)
  systemLabel!: SystemLabel;
}
