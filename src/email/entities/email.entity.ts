import { EmailStatus } from '@email/enums/email-status.enum';
import { SystemLabel } from '@shared/enums/system-label.enum';
import { BaseEntity } from '@shared/resource/entities/base.entity';
import { Column, Entity, Index, Unique } from 'typeorm';

@Entity('emails')
@Unique(['gmailMessageId'])
export class Email extends BaseEntity {
  @Column()
  gmailMessageId: string;

  @Column({ type: 'text', nullable: true })
  headerMessageId?: string;

  @Column({ nullable: true })
  threadId?: string;

  @Column({ nullable: true })
  subject?: string;

  @Column({ nullable: true })
  senderName?: string;

  @Column({ nullable: true })
  senderEmail?: string;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column('text', { array: true, default: '{}' })
  labelIds: string[];

  @Column('text', { array: true, nullable: true })
  @Index('idx_emails_system_labels', { synchronize: false })
  systemLabels: SystemLabel[];

  @Column({
    type: 'enum',
    enum: EmailStatus,
    default: EmailStatus.Labeling,
  })
  @Index('idx_emails_status')
  status: EmailStatus;

  @Column({ type: 'jsonb', nullable: true })
  history?: Record<string, Date>;
}
