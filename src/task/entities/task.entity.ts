import { Column, Entity, OneToMany } from 'typeorm';
import { BelongsToMessage } from '@email/entities/belongs-to-message.entity';
import { TaskPriority } from '../enums/task-priority.enum';
import { TaskStatus } from '../enums/task-status.enum';
import { TaskAssignee } from './task-assignee.entity';

@Entity()
export class Task extends BelongsToMessage {
  @Column('text', { array: true, nullable: true })
  assigners: string[];

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'timestamp', nullable: true })
  due?: Date;

  @Column({ type: 'enum', enum: TaskPriority, nullable: true })
  priority?: TaskPriority;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.Todo })
  status: TaskStatus;

  @OneToMany(() => TaskAssignee, (assignee) => assignee.task, { cascade: true, onDelete: 'CASCADE' })
  assignees: TaskAssignee[];
}
