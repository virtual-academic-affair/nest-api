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

  @Index('idx_emails_thread_id')
  @Column({ nullable: true })
  threadId?: string;

  @Column({ nullable: true })
  subject?: string;

  @Column({ nullable: true })
  senderName?: string;

  @Index('idx_emails_sender_email')
  @Column({ nullable: true })
  senderEmail?: string;

  @Index('idx_emails_sent_at')
  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column('text', { array: true, default: '{}' })
  labelIds: string[];

  @Column('text', { array: true, nullable: true })
  @Index('idx_emails_system_labels', { synchronize: false })
  systemLabels: SystemLabel[];

  @Column({ type: 'jsonb', nullable: true })
  history?: Record<string, Date>;
}
