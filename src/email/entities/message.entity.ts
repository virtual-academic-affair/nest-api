import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { Student } from '@authentication/entities/student.entity';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { MessageStatus } from '@email/enums/message-status.enum';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
import { EncryptedColumn } from '@shared/decorators/encrypted-column.decorator';
import { BaseEntity } from '@shared/resource/entities/base.entity';

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

  @Column({ nullable: true })
  studentCode?: string;

  @ManyToOne(() => Student, { nullable: true, eager: false })
  @JoinColumn({ name: 'studentCode', referencedColumnName: 'studentCode' })
  student?: Student;

  @EncryptedColumn({ type: 'text', nullable: true, select: false })
  content?: string;

  @Index()
  @Column({ type: 'enum', enum: MessageStatus, default: MessageStatus.Opened })
  status: MessageStatus;

  @OneToMany(() => Inquiry, (inquiry) => inquiry.message)
  inquiry: Inquiry[];

  @OneToMany(() => ClassRegistration, (classRegistration) => classRegistration.message)
  classRegistration: ClassRegistration[];
}
