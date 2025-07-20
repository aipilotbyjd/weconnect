import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';import { ApiProperty } from '@nestjs/swagger';

@Schema({ collection: 'execution_metrics' })
export class ExecutionMetric extends BaseSchema {
  @ApiProperty({ description: 'Workflow ID' })
  @Prop()
  workflowId: string;

  @ApiProperty({ description: 'Execution ID' })
  @Prop()
  executionId: string;

  @ApiProperty({ description: 'Node ID (optional)' })
  @Prop({ nullable: true })
  nodeId?: string;

  @ApiProperty({ description: 'Execution duration in milliseconds' })
  @Prop()
  duration: number;

  @ApiProperty({ description: 'Memory usage in bytes' })
  @Prop({ type: 'bigint', nullable: true })
  memoryUsage?: number;

  @ApiProperty({ description: 'CPU usage percentage' })
  @Prop({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  cpuUsage?: number;

  @ApiProperty({ description: 'Number of items processed' })
  @Prop({ default: 0 })
  itemsProcessed: number;

  @ApiProperty({ description: 'Was execution successful' })
  @Prop()
  success: boolean;

  @ApiProperty({ description: 'Error message if failed' })
  @Prop({ type: 'text', nullable: true })
  errorMessage?: string;

  @ApiProperty({ description: 'Execution mode' })
  @Prop()
  mode: string;

  @ApiProperty({ description: 'User ID' })
  @Prop()
  userId: string;

  @ApiProperty({ description: 'Organization ID' })
  @Prop({ nullable: true })
  organizationId?: string;

  @CreateDateColumn()
  recordedAt: Date;
}


export const ExecutionMetricSchema = SchemaFactory.createForClass(ExecutionMetric);