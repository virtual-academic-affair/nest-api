import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '@authentication/entities/user.entity';
import { BaseEntity } from '@shared/resource/entities/base.entity';
import { Task } from './task.entity';

@Entity()
export class TaskItem extends BaseEntity {
  @ManyToOne(() => Task, (task) => task.items, { onDelete: 'CASCADE' })
  @JoinColumn()
  task: Task;

  @Column()
  taskId: number;

  @Column()
  name: string;

  @Column({ default: false })
  isChecked: boolean;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  assignee?: User;

  @Column({ nullable: true })
  assigneeId?: number;

  @Column({ type: 'text', nullable: true })
  note?: string;
}
