import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BelongsToMessage } from '@email/entities/belongs-to-message.entity';
import { RegistrationItemDetail } from './registration-item-detail.entity';

@Entity('class_registrations')
export class ClassRegistration extends BelongsToMessage {
  // messageId inherits from BelongsToMessage - links to Message.id

  @Index('idx_class_registrations_student_code')
  @Column()
  studentCode: string; // MSSV

  @Index('idx_class_registrations_academic_year')
  @Column({ type: 'int' })
  academicYear: number; // Khóa học (Dùng để Sort ưu tiên)

  @Column({ nullable: true })
  studentName?: string; // Tên sinh viên

  @OneToMany(() => RegistrationItemDetail, (item) => item.classRegistration, {
    cascade: true,
  })
  items: RegistrationItemDetail[];
}