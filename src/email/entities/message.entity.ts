import { Column, Entity, Index, OneToMany, Unique } from 'typeorm';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { EmailLabel } from '@email/enums/email-label.enum';
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

  @Column({ type: 'jsonb', nullable: true })
  studentInfo?: StudentInfo;

  @Index()
  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column('text', { array: true, default: '{}' })
  labelIds: string[];

  @Index()
  @Column('text', { array: true, nullable: true })
  systemLabels: EmailLabel[];

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

export type StudentInfo = {
  studentCode?: string;
  cohort?: number;
};
