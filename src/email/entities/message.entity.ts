import { Column, Entity, Index, OneToMany, Unique } from 'typeorm';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
import { EncryptedColumn } from '@shared/encryption/decorators/encrypted-column.decorator';
import { SystemLabel } from '@shared/enums/system-label.enum';
import { BaseEntity } from '@shared/resource/entities/base.entity';
import { Task } from '@task/entities/task.entity';

@Entity()
@Unique(['gmailMessageId'])
export class Message extends BaseEntity {
  @Column()
  gmailMessageId: string;

  @Column({ type: 'text', nullable: true })
  headerMessageId?: string;

  @Index()
  @Column({ nullable: true })
  threadId?: string;

  @Column({ nullable: true })
  subject?: string;

  @Column({ nullable: true })
  senderName?: string;

  @Index()
  @Column({ nullable: true })
  senderEmail?: string;

  @Column()
  superEmail?: string;

  @Index()
  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column('text', { array: true, default: '{}' })
  labelIds: string[];

  @Index()
  @Column('text', { array: true, nullable: true })
  systemLabels: SystemLabel[];

  @EncryptedColumn({ type: 'text', nullable: true, select: false })
  content?: string;

  @OneToMany(() => Task, (task) => task.message)
  tasks: Task[];
  tasksCount: number;

  @OneToMany(() => Inquiry, (inquiry) => inquiry.message)
  inquiry: Inquiry;
  hasInquiry: boolean;

  @OneToMany(() => ClassRegistration, (classRegistration) => classRegistration.message)
  classRegistration: ClassRegistration;
  hasClassRegistration: boolean;
}
