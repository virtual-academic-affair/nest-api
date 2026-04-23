import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@shared/resource/entities/base.entity';

@Entity()
export class Student extends BaseEntity {
  @Index({ unique: true })
  @Column({ unique: true, nullable: false })
  studentCode: string;

  @Column({ nullable: false })
  studentName: string;
}
