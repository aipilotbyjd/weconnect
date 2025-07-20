import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';import { ApiProperty } from '@nestjs/swagger';
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

@Schema({ collection: 'workflow_executions' })
export class WorkflowExecution extends BaseSchema {
  @ApiProperty({ description: 'Execution status', enum: ExecutionStatus })
  @Prop({
    type: 'enum',
    enum: ExecutionStatus,
    default: ExecutionStatus.PENDING,
  })
  status: ExecutionStatus;

  @ApiProperty({ description: 'Execution mode', enum: ExecutionMode })
  @Prop({
    type: 'enum',
    enum: ExecutionMode,
  })
  mode: ExecutionMode;

  @ApiProperty({ description: 'Start time' })
  @Prop({ type: 'timestamp with time zone', nullable: true })
  startedAt?: Date;

  @ApiProperty({ description: 'End time' })
  @Prop({ type: 'timestamp with time zone', nullable: true })
  finishedAt?: Date;

  @ApiProperty({ description: 'Execution data' })
  @Prop({ type: 'json', nullable: true })
  data: Record<string, any>;

  @ApiProperty({ description: 'Execution error' })
  @Prop({ type: 'json', nullable: true })
  error?: Record<string, any>;

  @ApiProperty({ description: 'Execution metadata' })
  @Prop({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Retry count' })
  @Prop({ default: 0 })
  retryCount: number;

  @ApiProperty({ description: 'Current node ID' })
  @Prop({ nullable: true })
  currentNodeId?: string;

  // Relations
  @ManyToOne(() => Workflow, (workflow) => workflow.executions)
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Prop()
  workflowId: string;

  @OneToMany(() => WorkflowExecutionLog, (log) => log.execution, {
    cascade: true,
  })
  logs: WorkflowExecutionLog[];
}


export const WorkflowExecutionSchema = SchemaFactory.createForClass(WorkflowExecution);