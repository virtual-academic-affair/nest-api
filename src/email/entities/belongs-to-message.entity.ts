import { Message } from '@email/entities/message.entity';
import { BaseEntity } from '@shared/resource/entities/base.entity';
import { Column, JoinColumn, ManyToOne } from 'typeorm';

export abstract class BelongsToMessage extends BaseEntity {
  @Column({ nullable: true })
  messageId: number | null = null;

  @ManyToOne(() => Message, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'messageId' })
  message?: Message | null;
}
