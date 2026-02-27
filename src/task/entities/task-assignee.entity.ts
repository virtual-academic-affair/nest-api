import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '@authentication/entities/user.entity';
import { Task } from './task.entity';

@Entity()
export class TaskAssignee {
  @PrimaryColumn()
  taskId: number;

  @PrimaryColumn()
  assigneeId: number;

  @Column({ nullable: true })
  assignerId?: number;

  @CreateDateColumn()
  assignedAt: Date;

  @ManyToOne(() => Task, (task) => task.assignees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assigneeId' })
  assignee: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignerId' })
  assigner: User;
}
