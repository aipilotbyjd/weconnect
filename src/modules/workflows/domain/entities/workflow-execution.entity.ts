import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseSchema } from '../../../../core/abstracts/base.schema';
import { ApiProperty } from '@nestjs/swagger';

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
}

export enum ExecutionMode {
  MANUAL = 'manual',
  WEBHOOK = 'webhook',
  SCHEDULED = 'scheduled',
  API = 'api',
}

@Schema({ collection: 'workflow_executions' })
export class WorkflowExecution extends BaseSchema {
  @ApiProperty({ description: 'Execution status', enum: ExecutionStatus })
  @Prop({ type: String, enum: ExecutionStatus, default: ExecutionStatus.PENDING })
  status: ExecutionStatus;

  @ApiProperty({ description: 'Execution mode', enum: ExecutionMode })
  @Prop({ type: String, enum: ExecutionMode, required: true })
  mode: ExecutionMode;

  @ApiProperty({ description: 'Execution start time' })
  @Prop()
  startedAt?: Date;

  @ApiProperty({ description: 'Execution end time' })
  @Prop()
  finishedAt?: Date;

  @ApiProperty({ description: 'Execution duration in milliseconds' })
  @Prop()
  duration?: number;

  @ApiProperty({ description: 'Workflow ID being executed' })
  @Prop({ type: Types.ObjectId, ref: 'Workflow', required: true })
  workflowId: Types.ObjectId;

  @ApiProperty({ description: 'User who triggered the execution' })
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @ApiProperty({ description: 'Input data for the execution' })
  @Prop({ type: Object, default: {} })
  inputData: Record<string, any>;

  @ApiProperty({ description: 'Output data from the execution' })
  @Prop({ type: Object, default: {} })
  outputData: Record<string, any>;

  @ApiProperty({ description: 'Error message if execution failed' })
  @Prop()
  error?: string;

  @ApiProperty({ description: 'Error stack trace' })
  @Prop()
  errorStack?: string;

  @ApiProperty({ description: 'Execution metadata' })
  @Prop({ type: Object, default: {} })
  metadata: {
    trigger?: string;
    webhookId?: string;
    scheduledJobId?: string;
    retryCount?: number;
    parentExecutionId?: string;
  };

  @ApiProperty({ description: 'Number of nodes executed' })
  @Prop({ default: 0 })
  nodesExecuted: number;

  @ApiProperty({ description: 'Number of nodes that failed' })
  @Prop({ default: 0 })
  nodesFailed: number;

  @ApiProperty({ description: 'Execution progress percentage' })
  @Prop({ default: 0 })
  progress: number;
}

export const WorkflowExecutionSchema = SchemaFactory.createForClass(WorkflowExecution);