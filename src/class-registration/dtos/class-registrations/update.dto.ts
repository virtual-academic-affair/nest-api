import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateDto } from './create.dto';

export class UpdateDto extends PartialType(OmitType(CreateDto, ['messageId'] as const)) {}
