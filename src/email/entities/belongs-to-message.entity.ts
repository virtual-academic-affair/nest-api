import { Column, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Message } from '@email/entities/message.entity';
import { MessageStatus } from '@email/enums/belongs-to-message-status.enum';
import { BaseEntity } from '@shared/resource/entities/base.entity';

export abstract class BelongsToMessage extends BaseEntity {
  @Index()
  @Column({ type: 'enum', enum: MessageStatus, default: MessageStatus.Old })
  messageStatus: MessageStatus;

  @Index()
  @Column()
  messageId!: number;

  @ManyToOne(() => Message, { onDelete: 'CASCADE' })
  @JoinColumn()
  message!: Message;
}

export abstract class MayBelongsToMessage extends BaseEntity {
  @Index()
  @Column({ nullable: true })
  messageId?: number | null = null;

  @ManyToOne(() => Message, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  message?: Message | null;
}
