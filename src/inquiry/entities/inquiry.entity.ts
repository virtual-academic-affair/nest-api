import { Entity } from 'typeorm';
import { BelongsToMessage } from '@email/entities/belongs-to-message.entity';

@Entity()
export class Inquiry extends BelongsToMessage {}
