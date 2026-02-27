import { PartialType } from '@nestjs/mapped-types';
import { HasMessageIdDto } from '@email/dtos/messages/has-message-id.dto';

export class CreateDto extends PartialType(HasMessageIdDto) {}
