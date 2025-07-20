import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';import { ApiProperty } from '@nestjs/swagger';
import { WorkflowExecution } from './workflow-execution.entity';
import { WorkflowNode } from './workflow-node.entity';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

@Schema({ collection: 'workflow_execution_logs' })
export class WorkflowExecutionLog extends BaseSchema {
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

  @ApiProperty({ description: 'Log data' })
  @Prop({ type: 'json', nullable: true })
  data?: Record<string, any>;

  @ApiProperty({ description: 'Node input data' })
  @Prop({ type: 'json', nullable: true })
  nodeInput?: Record<string, any>;

  @ApiProperty({ description: 'Node output data' })
  @Prop({ type: 'json', nullable: true })
  nodeOutput?: Record<string, any>;

  @ApiProperty({ description: 'Execution time in ms' })
  @Prop({ nullable: true })
  executionTime?: number;

  // Relations
  @ManyToOne(() => WorkflowExecution, (execution) => execution.logs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'executionId' })
  execution: WorkflowExecution;

  @Prop()
  executionId: string;

  @ManyToOne(() => WorkflowNode, { nullable: true })
  @JoinColumn({ name: 'nodeId' })
  node?: WorkflowNode;

  @Prop({ nullable: true })
  nodeId?: string;
}


export const WorkflowExecutionLogSchema = SchemaFactory.createForClass(WorkflowExecutionLog);