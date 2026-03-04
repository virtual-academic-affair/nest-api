import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateDto } from './create.dto';

export class UpdateDto extends PartialType(OmitType(CreateDto, ['messageId'] as const)) {}
