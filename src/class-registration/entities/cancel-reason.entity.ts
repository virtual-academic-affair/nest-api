import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@shared/resource/entities/base.entity';

@Entity()
export class CancelReason extends BaseEntity {
  @Column()
  content: string;

  @Index()
  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
