import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';import { ApiProperty } from '@nestjs/swagger';

export enum AlertType {
  CRITICAL_JOB_FAILURE = 'critical_job_failure',
  EXECUTION_TIMEOUT = 'execution_timeout',
  HIGH_ERROR_RATE = 'high_error_rate',
  RESOURCE_LIMIT = 'resource_limit',
  SECURITY_BREACH = 'security_breach',
  SYSTEM_DOWN = 'system_down',
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  PENDING = 'pending',
  SENT = 'sent',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
}

@Schema({ collection: 'alerts' })
export class Alert extends BaseSchema {
  @ApiProperty({ description: 'Alert type', enum: AlertType })
  @Prop({
    type: 'enum',
    enum: AlertType,
  })
  type: AlertType;

  @ApiProperty({ description: 'Alert severity', enum: AlertSeverity })
  @Prop({
    type: 'enum',
    enum: AlertSeverity,
    default: AlertSeverity.ERROR,
  })
  severity: AlertSeverity;

  @ApiProperty({ description: 'Alert status', enum: AlertStatus })
  @Prop({
    type: 'enum',
    enum: AlertStatus,
  })
  status: AlertStatus;

  @ApiProperty({ description: 'Alert title' })
  @Prop()
  title: string;

  @ApiProperty({ description: 'Alert message' })
  @Prop({ type: 'text' })
  message: string;

  @ApiProperty({ description: 'Alert metadata' })
  @Prop({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Channels notified' })
  @Prop({ type: 'jsonb', default: [] })
  channelsNotified: string[];

  @ApiProperty({ description: 'Acknowledged by user ID' })
  @Prop({ nullable: true })
  acknowledgedBy?: string;

  @ApiProperty({ description: 'Acknowledged at timestamp' })
  @Prop({ type: 'timestamp', nullable: true })
  acknowledgedAt?: Date;

  @ApiProperty({ description: 'Resolved by user ID' })
  @Prop({ nullable: true })
  resolvedBy?: string;

  @ApiProperty({ description: 'Resolved at timestamp' })
  @Prop({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @ApiProperty({ description: 'Resolution notes' })
  @Prop({ type: 'text', nullable: true })
  resolutionNotes?: string;
}


export const AlertSchema = SchemaFactory.createForClass(Alert);