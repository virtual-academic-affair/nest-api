import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BelongsToMessage } from '@email/entities/belongs-to-message.entity';
import { ClassRegistrationItem } from './class-registration-item.entity';

@Entity()
export class ClassRegistration extends BelongsToMessage {
  @Column({ type: 'text', nullable: true })
  note?: string;

  @OneToMany(() => ClassRegistrationItem, (item) => item.parent, { cascade: true, onDelete: 'CASCADE' })
  items: ClassRegistrationItem[];
  itemsCount: number;
}
