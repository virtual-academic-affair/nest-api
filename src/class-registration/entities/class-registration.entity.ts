import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BelongsToMessage } from '@email/entities/belongs-to-message.entity';
import { ClassRegistrationItem } from './class-registration-item.entity';

@Entity()
export class ClassRegistration extends BelongsToMessage {
  @Index('idx_class_registrations_student_code')
  @Column()
  studentCode: string;

  @Index('idx_class_registrations_academic_year')
  @Column({ type: 'smallint', nullable: true })
  academicYear?: number;

  @Column({ nullable: true })
  studentName?: string;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @OneToMany(() => ClassRegistrationItem, (item) => item.parent, { cascade: true, onDelete: 'CASCADE' })
  items: ClassRegistrationItem[];
  itemsCount: number;
}
