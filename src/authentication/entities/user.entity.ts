import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Role } from '@authentication/decorators/roles.decorator';
import { Student } from '@authentication/entities/student.entity';
import { BaseEntity } from '@shared/resource/entities/base.entity';

@Entity()
export class User extends BaseEntity {
  @Index()
  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ nullable: true })
  googleId?: string;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'enum', enum: Role, default: Role.Student })
  role: Role;

  @Column({ nullable: true })
  picture?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ nullable: true })
  studentCode?: string;

  @ManyToOne(() => Student, { nullable: true, eager: true })
  @JoinColumn({ name: 'studentCode', referencedColumnName: 'studentCode' })
  student?: Student;
}
