import { Entity, Column, Index, CreateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';
import { ApiProperty } from '@nestjs/swagger';

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

@Entity('alerts')
@Index(['type', 'createdAt'])
@Index(['status', 'severity'])
export class Alert extends BaseEntity {
  @ApiProperty({ description: 'Alert type', enum: AlertType })
  @Column({
    type: 'enum',
    enum: AlertType,
  })
  type: AlertType;

  @ApiProperty({ description: 'Alert severity', enum: AlertSeverity })
  @Column({
    type: 'enum',
    enum: AlertSeverity,
    default: AlertSeverity.ERROR,
  })
  severity: AlertSeverity;

  @ApiProperty({ description: 'Alert status', enum: AlertStatus })
  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.PENDING,
  })
  status: AlertStatus;

  @ApiProperty({ description: 'Alert title' })
  @Column()
  title: string;

  @ApiProperty({ description: 'Alert message' })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({ description: 'Alert metadata' })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Channels notified' })
  @Column({ type: 'jsonb', default: [] })
  channelsNotified: string[];

  @ApiProperty({ description: 'Acknowledged by user ID' })
  @Column({ nullable: true })
  acknowledgedBy?: string;

  @ApiProperty({ description: 'Acknowledged at timestamp' })
  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt?: Date;

  @ApiProperty({ description: 'Resolved by user ID' })
  @Column({ nullable: true })
  resolvedBy?: string;

  @ApiProperty({ description: 'Resolved at timestamp' })
  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @ApiProperty({ description: 'Resolution notes' })
  @Column({ type: 'text', nullable: true })
  resolutionNotes?: string;

}
