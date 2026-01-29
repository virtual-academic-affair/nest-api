import { PartialType } from '@nestjs/swagger';
import { HasMessageIdDto } from '@email/dtos/messages/has-message-id.dto';

export class CreateDto extends PartialType(HasMessageIdDto) {}
