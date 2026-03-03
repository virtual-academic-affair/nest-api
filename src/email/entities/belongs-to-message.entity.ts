import { Column, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Message } from '@email/entities/message.entity';
import { MessageStatus } from '@email/enums/message-status.enum';
import { BaseEntity } from '@shared/resource/entities/base.entity';

export abstract class BelongsToMessage extends BaseEntity {
  @Index()
  @Column({ nullable: true })
  messageId: number | null = null;

  @ManyToOne(() => Message, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  message?: Message | null;

  @Index()
  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.Opened,
  })
  messageStatus: MessageStatus;
}
