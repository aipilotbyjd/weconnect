import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';import { ApiProperty } from '@nestjs/swagger';

export enum LimitType {
  USER = 'user',
  ORGANIZATION = 'organization',
  API_KEY = 'api_key',
}

export enum LimitPeriod {
  HOURLY = 'hourly',
  DAILY = 'daily',
  MONTHLY = 'monthly',
}

@Schema({ collection: 'execution_limits' })
export class ExecutionLimit extends BaseSchema {
  @ApiProperty({ description: 'Entity ID (user, org, or API key)' })
  @Prop()
  entityId: string;

  @ApiProperty({ description: 'Entity type', enum: LimitType })
  @Prop({
    type: 'enum',
    enum: LimitType,
  })
  entityType: LimitType;

  @ApiProperty({ description: 'Limit period', enum: LimitPeriod })
  @Prop({
    type: 'enum',
    enum: LimitPeriod,
  })
  period: LimitPeriod;

  @ApiProperty({ description: 'Maximum executions allowed' })
  @Prop()
  maxExecutions: number;

  @ApiProperty({ description: 'Maximum execution time in milliseconds' })
  @Prop({ nullable: true })
  maxExecutionTime?: number;

  @ApiProperty({ description: 'Maximum memory usage in MB' })
  @Prop({ nullable: true })
  maxMemoryUsage?: number;

  @ApiProperty({ description: 'Maximum concurrent executions' })
  @Prop({ default: 5 })
  maxConcurrentExecutions: number;

  @ApiProperty({ description: 'Current usage count for this period' })
  @Prop({ default: 0 })
  currentUsage: number;

  @ApiProperty({ description: 'Period start timestamp' })
  @Prop({ type: 'timestamp' })
  periodStart: Date;

  @ApiProperty({ description: 'Is limit active' })
  @Prop({ default: true })
  isActive: boolean;
}


export const ExecutionLimitSchema = SchemaFactory.createForClass(ExecutionLimit);