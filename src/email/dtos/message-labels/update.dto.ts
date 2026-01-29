import { IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';
import { SystemLabel } from '@shared/enums/system-label.enum';
import { HasMessageIdDto } from '@email/dtos/message-labels/has-message-id.dto';

export class UpdateDto extends HasMessageIdDto {
  @IsBoolean()
  @IsNotEmpty()
  isRemove: boolean;

  @IsEnum(SystemLabel)
  @IsNotEmpty()
  systemLabel!: SystemLabel;
}
