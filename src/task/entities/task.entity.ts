import { BelongsToMessage } from '@email/entities/belongs-to-message.entity';
import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TaskAssignee } from './task-assignee.entity';
import { TaskPriority } from '../enums/task-priority.enum';
import { TaskStatus } from '../enums/task-status.enum';

@Entity('tasks')
export class Task extends BelongsToMessage {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  override id: number;

  @Column('simple-array', { nullable: true })
  assigners: string[];

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp', nullable: true })
  deadline: Date;

  @Column({ type: 'enum', enum: TaskPriority, nullable: true })
  priority: TaskPriority;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO })
  status: TaskStatus;

  @OneToMany(() => TaskAssignee, (assignee) => assignee.task, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  taskAssignees: TaskAssignee[];
}
