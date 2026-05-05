import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { RegistrationAction } from '@class-registration/enums/registration-action.enum';
import { RegistrationStatus } from '@class-registration/enums/registration-status.enum';
import { BaseEntity } from '@shared/resource/entities/base.entity';
import { ClassRegistration } from './class-registration.entity';

@Entity()
@Index(['parentId', 'subjectName', 'action', 'className'], { unique: true, where: '"className" IS NOT NULL' })
@Index(['parentId', 'subjectName', 'action'], { unique: true, where: '"className" IS NULL' })
export class ClassRegistrationItem extends BaseEntity {
  @Index()
  @Column()
  parentId: number;

  @ManyToOne(() => ClassRegistration, (registration) => registration.items, { onDelete: 'CASCADE' })
  @JoinColumn()
  parent: ClassRegistration;

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

  @Index()
  @Column({ type: 'enum', enum: RegistrationStatus, default: RegistrationStatus.Pending })
  status: RegistrationStatus;

  @Column('text', { nullable: true })
  note?: string;
}
