import { HasMessageIdDto } from '@email/dtos/message-labels/has-message-id.dto';
import { PartialType } from '@nestjs/swagger';

export class CreateDto extends PartialType(HasMessageIdDto) {}
