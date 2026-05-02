import { Column, Index, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { MessageStatus } from '@email/enums/belongs-to-message-status.enum';
import { BaseEntity } from '@shared/resource/entities/base.entity';

export abstract class BelongsToMessage extends BaseEntity {
  @Index()
  @Column({ type: 'enum', enum: MessageStatus, default: MessageStatus.New })
  messageStatus: MessageStatus;

  @Index()
  @Column()
  messageId!: number;

  @OneToOne('Message', { onDelete: 'CASCADE' })
  @JoinColumn()
  message!: any;
}

export abstract class MayBelongsToMessage extends BaseEntity {
  @Index()
  @Column({ nullable: true })
  messageId?: number | null = null;

  @ManyToOne('Message', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  message?: any;
}
