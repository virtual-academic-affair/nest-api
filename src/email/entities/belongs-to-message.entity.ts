import { Message } from '@email/entities/message.entity';
import { BaseEntity } from '@shared/resource/entities/base.entity';
import { Column, Index, JoinColumn, ManyToOne } from 'typeorm';

export abstract class BelongsToMessage extends BaseEntity {
  @Index()
  @Column({ nullable: true })
  messageId: number | null = null;

  @ManyToOne(() => Message, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  message?: Message | null;
}
