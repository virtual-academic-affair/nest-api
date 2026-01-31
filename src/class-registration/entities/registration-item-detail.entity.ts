import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@shared/resource/entities/base.entity';
import { RegistrationAction } from '@class-registration/enums/registration-action.enum';
import { RegistrationStatus } from '@class-registration/enums/registration-status.enum';
import { ClassRegistration } from './class-registration.entity';

@Entity('class_registration_items')
export class RegistrationItemDetail extends BaseEntity {
  @Index('idx_class_registration_items_registration_id')
  @Column()
  classRegistrationId: number;

  @ManyToOne(
    () => ClassRegistration,
    (registration) => registration.items,
    { onDelete: 'CASCADE' }
  )
  @JoinColumn({ name: 'classRegistrationId' })
  classRegistration: ClassRegistration;

  @Index('idx_class_registration_items_action')
  @Column({ type: 'enum', enum: RegistrationAction })
  action: RegistrationAction; // REGISTER, CANCEL, REQUEST_OPEN

  @Index('idx_class_registration_items_subject_name')
  @Column()
  subjectName: string; // Tên môn học (Bắt buộc)

  @Column({ nullable: true })
  className?: string; // Tên lớp (Bắt buộc nếu REGISTER/CANCEL, null nếu REQUEST_OPEN)

  @Column({ nullable: true })
  subjectCode?: string; // Mã môn học

  @Column({ nullable: true })
  slotInfo?: string; // Buổi học

  @Index('idx_class_registration_items_is_in_curriculum')
  @Column({ type: 'boolean', default: false })
  isInCurriculum: boolean; // Trong CTDT hay ngoài CTDT (Dùng để Sort ưu tiên)

  @Index('idx_class_registration_items_status')
  @Column({
    type: 'enum',
    enum: RegistrationStatus,
    default: RegistrationStatus.PENDING,
  })
  status: RegistrationStatus; // PENDING, APPROVED, REJECTED

  @Column({ type: 'text', nullable: true })
  rejectReason?: string; // Lưu text lý do khi bị Reject (Lưu cứng giá trị)
}
