import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';import { ApiProperty } from '@nestjs/swagger';
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

@Schema({ collection: 'executions' })
export class Execution extends BaseSchema {
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
    default: ExecutionMode.MANUAL,
  })
  mode: ExecutionMode;

  @ApiProperty({ description: 'Execution start time' })
  @Prop({ type: 'timestamp with time zone', nullable: true })
  startedAt?: Date;

  @ApiProperty({ description: 'Execution finish time' })
  @Prop({ type: 'timestamp with time zone', nullable: true })
  finishedAt?: Date;

  @ApiProperty({ description: 'Execution duration in milliseconds' })
  @Prop({ type: 'int', nullable: true })
  duration?: number;

  @ApiProperty({ description: 'Execution input data' })
  @Prop({ type: 'jsonb', default: {} })
  inputData: Record<string, any>;

  @ApiProperty({ description: 'Execution output data' })
  @Prop({ type: 'jsonb', default: {} })
  outputData: Record<string, any>;

  @ApiProperty({ description: 'Error message if execution failed' })
  @Prop({ type: 'text', nullable: true })
  errorMessage?: string;

  @ApiProperty({ description: 'Error stack trace' })
  @Prop({ type: 'text', nullable: true })
  errorStack?: string;

  @ApiProperty({ description: 'Current executing node ID' })
  @Prop({ nullable: true })
  currentNodeId?: string;

  @ApiProperty({ description: 'Execution progress (0-100)' })
  @Prop({ type: 'int', default: 0 })
  progress: number;

  // Relations
  @ManyToOne(() => Workflow, { eager: true })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Prop()
  workflowId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Prop()
  userId: string;

  @OneToMany(() => ExecutionLog, (log) => log.execution, { cascade: true })
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


export const ExecutionSchema = SchemaFactory.createForClass(Execution);