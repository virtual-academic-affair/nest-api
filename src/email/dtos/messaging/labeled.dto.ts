import { ArrayUnique, IsArray, IsDefined, IsEnum } from 'class-validator';
import { SystemLabel } from '@shared/enums/system-label.enum';
import { NlpDto } from '@email/dtos/messaging/nlp.dto';

export class LabeledDto extends NlpDto {
  @IsDefined()
  @IsArray()
  @ArrayUnique()
  @IsEnum(SystemLabel, { each: true })
  labels!: SystemLabel[];
}
