import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { RegistrationAction } from '@class-registration/enums/registration-action.enum';
import { RegistrationStatus } from '@class-registration/enums/registration-status.enum';
import { BaseEntity } from '@shared/resource/entities/base.entity';
import { ClassRegistration } from './class-registration.entity';

@Entity()
@Index('IDX_item_createdAt_action', ['createdAt', 'action'])
export class ClassRegistrationItem extends BaseEntity {
  @Index()
  @Column()
  classRegistrationId: number;

  @ManyToOne(() => ClassRegistration, (registration) => registration.items, { onDelete: 'CASCADE' })
  @JoinColumn()
  classRegistration: ClassRegistration;

  @Index()
  @Column({ type: 'enum', enum: RegistrationAction })
  action: RegistrationAction;

  @Index()
  @Column()
  subjectName: string;

  @Column({ nullable: true })
  className?: string;

  @Column({ nullable: true })
  subjectCode?: string;

  @Column({ nullable: true })
  slotInfo?: string;

  @Index()
  @Column({ type: 'boolean' })
  isInCurriculum: boolean;

  @Index()
  @Column({ type: 'enum', enum: RegistrationStatus, default: RegistrationStatus.Pending })
  status: RegistrationStatus;

  @Column('text', { array: true, nullable: true })
  rejectReasons?: string[];
}
