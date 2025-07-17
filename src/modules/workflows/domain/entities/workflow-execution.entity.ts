import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Workflow } from './workflow.entity';
import { WorkflowExecutionLog } from './workflow-execution-log.entity';

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
  WAITING = 'waiting',
}

export enum ExecutionMode {
  MANUAL = 'manual',
  TRIGGER = 'trigger',
  SCHEDULED = 'scheduled',
  WEBHOOK = 'webhook',
  TEST = 'test',
}

@Entity('workflow_executions')
export class WorkflowExecution extends BaseEntity {
  @ApiProperty({ description: 'Execution status', enum: ExecutionStatus })
  @Column({
    type: 'enum',
    enum: ExecutionStatus,
    default: ExecutionStatus.PENDING,
  })
  status: ExecutionStatus;

  @ApiProperty({ description: 'Execution mode', enum: ExecutionMode })
  @Column({
    type: 'enum',
    enum: ExecutionMode,
  })
  mode: ExecutionMode;

  @ApiProperty({ description: 'Start time' })
  @Column({ type: 'timestamp with time zone', nullable: true })
  startedAt?: Date;

  @ApiProperty({ description: 'End time' })
  @Column({ type: 'timestamp with time zone', nullable: true })
  finishedAt?: Date;

  @ApiProperty({ description: 'Execution data' })
  @Column({ type: 'json', nullable: true })
  data: Record<string, any>;

  @ApiProperty({ description: 'Execution error' })
  @Column({ type: 'json', nullable: true })
  error?: Record<string, any>;

  @ApiProperty({ description: 'Execution metadata' })
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Retry count' })
  @Column({ default: 0 })
  retryCount: number;

  @ApiProperty({ description: 'Current node ID' })
  @Column({ nullable: true })
  currentNodeId?: string;

  // Relations
  @ManyToOne(() => Workflow, (workflow) => workflow.executions)
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Column()
  workflowId: string;

  @OneToMany(() => WorkflowExecutionLog, (log) => log.execution, {
    cascade: true,
  })
  logs: WorkflowExecutionLog[];
}
