import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Workflow } from '../../../workflows/domain/entities/workflow.entity';

export enum ScheduleStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  DELETED = 'deleted',
}

@Entity('scheduled_workflows')
@Index(['workflowId', 'status'])
export class ScheduledWorkflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  workflowId: string;

  @ManyToOne(() => Workflow, { onDelete: 'CASCADE' })
  workflow: Workflow;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  cronExpression: string;

  @Column({ nullable: true })
  timezone: string;

  @Column({
    type: 'enum',
    enum: ScheduleStatus,
    default: ScheduleStatus.ACTIVE,
  })
  status: ScheduleStatus;

  @Column({ type: 'jsonb', nullable: true })
  inputData: Record<string, any>;

  @Column({ nullable: true })
  lastExecutionId: string;

  @Column({ type: 'timestamp', nullable: true })
  lastExecutionAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextExecutionAt: Date;

  @Column({ default: 0 })
  executionCount: number;

  @Column({ default: 0 })
  failureCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  userId: string;

  @Column({ nullable: true })
  organizationId: string;
}
