import { Column, Entity, Index } from 'typeorm';
import { Role } from '@authentication/decorators/roles.decorator';
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

  @Column({ type: 'jsonb', nullable: true })
  profile?: Profile;

  @Column({ nullable: true })
  picture?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}

export type Profile = {
  enrollmentYear?: number;
  major?: string;
};
