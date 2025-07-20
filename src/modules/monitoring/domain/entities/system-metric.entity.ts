import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';import { ApiProperty } from '@nestjs/swagger';

@Schema({ collection: 'system_metrics' })
export class SystemMetric extends BaseSchema {
  @ApiProperty({ description: 'CPU usage percentage' })
  @Prop({ type: 'decimal', precision: 5, scale: 2 })
  cpuUsage: number;

  @ApiProperty({ description: 'Memory usage in bytes' })
  @Prop({ type: 'bigint' })
  memoryUsage: number;

  @ApiProperty({ description: 'Total memory in bytes' })
  @Prop({ type: 'bigint' })
  memoryTotal: number;

  @ApiProperty({ description: 'Free memory in bytes' })
  @Prop({ type: 'bigint' })
  memoryFree: number;

  @ApiProperty({ description: 'Load average' })
  @Prop({ type: 'decimal', precision: 5, scale: 2 })
  loadAverage: number;

  @ApiProperty({ description: 'Active database connections' })
  @Prop({ default: 0 })
  activeConnections: number;

  @ApiProperty({ description: 'Queue size' })
  @Prop({ default: 0 })
  queueSize: number;

  @CreateDateColumn()
  recordedAt: Date;
}


export const SystemMetricSchema = SchemaFactory.createForClass(SystemMetric);