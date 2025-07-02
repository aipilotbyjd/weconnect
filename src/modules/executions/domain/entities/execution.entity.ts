import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Workflow } from '../../../workflows/domain/entities/workflow.entity';
import { User } from '../../../auth/domain/entities/user.entity';
import { ExecutionLog } from './execution-log.entity';

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
}

export enum ExecutionMode {
  MANUAL = 'manual',
  WEBHOOK = 'webhook',
  SCHEDULED = 'scheduled',
  TEST = 'test',
}

@Entity('executions')
export class Execution extends BaseEntity {
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
    default: ExecutionMode.MANUAL,
  })
  mode: ExecutionMode;

  @ApiProperty({ description: 'Execution start time' })
  @Column({ type: 'timestamp with time zone', nullable: true })
  startedAt?: Date;

  @ApiProperty({ description: 'Execution finish time' })
  @Column({ type: 'timestamp with time zone', nullable: true })
  finishedAt?: Date;

  @ApiProperty({ description: 'Execution duration in milliseconds' })
  @Column({ type: 'int', nullable: true })
  duration?: number;

  @ApiProperty({ description: 'Execution input data' })
  @Column({ type: 'jsonb', default: {} })
  inputData: Record<string, any>;

  @ApiProperty({ description: 'Execution output data' })
  @Column({ type: 'jsonb', default: {} })
  outputData: Record<string, any>;

  @ApiProperty({ description: 'Error message if execution failed' })
  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @ApiProperty({ description: 'Error stack trace' })
  @Column({ type: 'text', nullable: true })
  errorStack?: string;

  @ApiProperty({ description: 'Current executing node ID' })
  @Column({ nullable: true })
  currentNodeId?: string;

  @ApiProperty({ description: 'Execution progress (0-100)' })
  @Column({ type: 'int', default: 0 })
  progress: number;

  // Relations
  @ManyToOne(() => Workflow, { eager: true })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Column()
  workflowId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @OneToMany(() => ExecutionLog, log => log.execution, { cascade: true })
  logs: ExecutionLog[];

  get isCompleted(): boolean {
    return [
      ExecutionStatus.COMPLETED,
      ExecutionStatus.FAILED,
      ExecutionStatus.CANCELLED,
      ExecutionStatus.TIMEOUT,
    ].includes(this.status);
  }

  get isRunning(): boolean {
    return this.status === ExecutionStatus.RUNNING;
  }
}
