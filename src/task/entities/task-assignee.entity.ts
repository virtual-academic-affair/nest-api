import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@shared/resource/entities/base.entity';
import { Task } from './task.entity';
import { User } from '@authentication/entities/user.entity';

@Entity('task_assignees')
export class TaskAssignee extends BaseEntity {
  @ManyToOne(() => Task, (task) => task.taskAssignees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;

  @Column({ name: 'task_id' })
  taskId: number;

  @Column()
  name: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignee_id' })
  assignee?: User;

  @Column({ name: 'assignee_id', nullable: true })
  assigneeId?: number;

  @Column({ name: 'assigned_at', type: 'timestamp', nullable: true })
  assignedAt?: Date;
}
