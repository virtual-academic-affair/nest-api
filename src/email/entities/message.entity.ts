import { Column, Entity, Index, JoinColumn, ManyToOne, OneToOne, Unique } from 'typeorm';
import { Student } from '@authentication/entities/student.entity';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
import { EncryptedColumn } from '@shared/decorators/encrypted-column.decorator';
import { BaseEntity } from '@shared/resource/entities/base.entity';

@Entity()
@Index('UQ_message_current_thread', ['threadId'], {
  unique: true,
  where: `"isCurrent" = true AND "threadId" IS NOT NULL`,
})
@Unique(['gmailMessageId'])
export class Message extends BaseEntity {
  @Column()
  gmailMessageId: string;

  @Column({ type: 'text', nullable: true })
  headerMessageId?: string;

  @Index()
  @Column()
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
  @Column({ type: 'boolean', default: true })
  isCurrent: boolean;

  @Column({ nullable: true })
  studentCode?: string;

  @ManyToOne(() => Student, { nullable: true, eager: false })
  @JoinColumn({ name: 'studentCode', referencedColumnName: 'studentCode' })
  student?: Student;

  @EncryptedColumn({ type: 'text', nullable: true, select: false })
  content?: string;

  @OneToOne(() => Inquiry, (inquiry) => inquiry.message, { nullable: true })
  inquiry: Inquiry;

  @OneToOne(() => ClassRegistration, (classRegistration) => classRegistration.message, { nullable: true })
  classRegistration: ClassRegistration;
}
