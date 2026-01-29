import { Column, Entity, Index } from 'typeorm';
import { Role } from '@authentication/enums/role.enum';
import { BaseEntity } from '@shared/resource/entities/base.entity';

@Entity()
export class User extends BaseEntity {
  @Index('idx_users_email')
  @Column({ unique: true, nullable: false })
  email: string;

  @Column({ unique: true, nullable: true })
  googleId?: string;

  @Column({ nullable: true })
  name: string;

  @Column({ enum: Role, default: Role.Student })
  role: Role;

  @Column({ nullable: true })
  picture?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
