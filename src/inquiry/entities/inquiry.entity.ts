import { BelongsToMessage } from '@email/entities/belongs-to-message.entity';
import { Entity } from 'typeorm';

@Entity()
export class Inquiry extends BelongsToMessage {}
