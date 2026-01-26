import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/resource/entities/base.entity';

@Entity('settings')
export class Setting extends BaseEntity {
  @Column({ unique: true, nullable: false })
  key: string;

  @Column({ type: 'jsonb', nullable: false })
  value: Record<string, unknown> | unknown[] | string | number | boolean;
}
