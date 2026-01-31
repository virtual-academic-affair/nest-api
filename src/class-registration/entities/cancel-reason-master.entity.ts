import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@shared/resource/entities/base.entity';

@Entity('cancel_reasons_master')
export class CancelReasonMaster extends BaseEntity {
  @Column()
  reasonText: string; // Dùng để giáo vụ chọn nhanh
}
