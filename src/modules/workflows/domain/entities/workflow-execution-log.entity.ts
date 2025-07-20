import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseSchema } from '../../../../core/abstracts/base.schema';
import { ApiProperty } from '@nestjs/swagger';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

@Schema({ collection: 'workflow_execution_logs' })
export class WorkflowExecutionLog extends BaseSchema {
  @ApiProperty({ description: 'Log level', enum: LogLevel })
  @Prop({ type: String, enum: LogLevel, required: true })
  level: LogLevel;

  @ApiProperty({ description: 'Log message' })
  @Prop({ required: true })
  message: string;

  @ApiProperty({ description: 'Execution ID this log belongs to' })
  @Prop({ type: Types.ObjectId, ref: 'WorkflowExecution', required: true })
  executionId: Types.ObjectId;

  @ApiProperty({ description: 'Node ID that generated this log' })
  @Prop({ type: Types.ObjectId, ref: 'WorkflowNode' })
  nodeId?: Types.ObjectId;

  @ApiProperty({ description: 'Log timestamp' })
  @Prop({ default: Date.now })
  timestamp: Date;

  @ApiProperty({ description: 'Additional log data' })
  @Prop({ type: Object, default: {} })
  data: Record<string, any>;

  @ApiProperty({ description: 'Error details if log level is error' })
  @Prop()
  error?: {
    name: string;
    message: string;
    stack?: string;
  };

  @ApiProperty({ description: 'Node execution duration in milliseconds' })
  @Prop()
  duration?: number;

  @ApiProperty({ description: 'Input data for the node' })
  @Prop({ type: Object })
  inputData?: Record<string, any>;

  @ApiProperty({ description: 'Output data from the node' })
  @Prop({ type: Object })
  outputData?: Record<string, any>;
}

export const WorkflowExecutionLogSchema = SchemaFactory.createForClass(WorkflowExecutionLog);