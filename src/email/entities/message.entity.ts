import { Column, Entity, Index, Unique } from 'typeorm';
import { EmailReplyService } from '@email/services/email-reply.service';
import { SystemLabel } from '@shared/enums/system-label.enum';
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

  @Index()
  @Column('text', { array: true, nullable: true })
  systemLabels: SystemLabel[];

  /**
   * Reply to this message - uses singleton EmailReplyService instance
   * @param content - The new content to send
   * @param senderName - Optional custom sender name
   * @returns The Gmail message ID of the sent reply
   */
  async reply(content: string, senderName?: string): Promise<string> {
    return EmailReplyService.instance.reply(this, content, senderName);
  }
}
