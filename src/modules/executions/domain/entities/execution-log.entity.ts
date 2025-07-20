import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';import { ApiProperty } from '@nestjs/swagger';
import { Execution } from './execution.entity';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

@Schema({ collection: 'execution_logs' })
export class ExecutionLog extends BaseSchema {
  @ApiProperty({ description: 'Log level', enum: LogLevel })
  @Prop({
    type: 'enum',
    enum: LogLevel,
    default: LogLevel.INFO,
  })
  level: LogLevel;

  @ApiProperty({ description: 'Log message' })
  @Prop({ type: 'text' })
  message: string;

  @ApiProperty({ description: 'Node ID that generated this log' })
  @Prop({ nullable: true })
  nodeId?: string;

  @ApiProperty({ description: 'Node name' })
  @Prop({ nullable: true })
  nodeName?: string;

  @ApiProperty({ description: 'Additional log data' })
  @Prop({ type: 'jsonb', default: {} })
  data: Record<string, any>;

  @ApiProperty({ description: 'Execution duration for this step in ms' })
  @Prop({ type: 'int', nullable: true })
  duration?: number;

  // Relations
  @ManyToOne(() => Execution, (execution) => execution.logs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'executionId' })
  execution: Execution;

  @Prop()
  executionId: string;
}


export const ExecutionLogSchema = SchemaFactory.createForClass(ExecutionLog);