import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@shared/resource/entities/base.entity';

@Entity('form')
export class Form extends BaseEntity {
  @Column({ nullable: false })
  documentType: string;

  @Column({ nullable: false })
  contentLink: string;

  @Column({ nullable: true })
  linkDisplayName: string;

  @Column({ type: 'text', nullable: true })
  notes: string;
}
