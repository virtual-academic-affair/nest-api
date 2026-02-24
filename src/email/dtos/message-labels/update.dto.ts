import { IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';
import { HasMessageIdDto } from '@email/dtos/messages/has-message-id.dto';
import { SystemLabel } from '@shared/enums/system-label.enum';

export class UpdateDto extends HasMessageIdDto {
  @IsBoolean()
  @IsNotEmpty()
  isRemove: boolean;

  @IsEnum(SystemLabel)
  @IsNotEmpty()
  systemLabel!: SystemLabel;
}
