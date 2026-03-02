import { Column, Entity } from 'typeorm';
import { BelongsToMessage } from '@email/entities/belongs-to-message.entity';

@Entity()
export class Inquiry extends BelongsToMessage {
  @Column('text')
  question: string;

  @Column('text', { nullable: true })
  answer: string | null = null;
}
