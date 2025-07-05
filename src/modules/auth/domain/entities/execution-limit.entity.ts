import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';
import { ApiProperty } from '@nestjs/swagger';

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

@Entity('execution_limits')
@Index(['entityId', 'entityType'])
export class ExecutionLimit extends BaseEntity {
  @ApiProperty({ description: 'Entity ID (user, org, or API key)' })
  @Column()
  entityId: string;

  @ApiProperty({ description: 'Entity type', enum: LimitType })
  @Column({
    type: 'enum',
    enum: LimitType,
  })
  entityType: LimitType;

  @ApiProperty({ description: 'Limit period', enum: LimitPeriod })
  @Column({
    type: 'enum',
    enum: LimitPeriod,
  })
  period: LimitPeriod;

  @ApiProperty({ description: 'Maximum executions allowed' })
  @Column()
  maxExecutions: number;

  @ApiProperty({ description: 'Maximum execution time in milliseconds' })
  @Column({ nullable: true })
  maxExecutionTime?: number;

  @ApiProperty({ description: 'Maximum memory usage in MB' })
  @Column({ nullable: true })
  maxMemoryUsage?: number;

  @ApiProperty({ description: 'Maximum concurrent executions' })
  @Column({ default: 5 })
  maxConcurrentExecutions: number;

  @ApiProperty({ description: 'Current usage count for this period' })
  @Column({ default: 0 })
  currentUsage: number;

  @ApiProperty({ description: 'Period start timestamp' })
  @Column({ type: 'timestamp' })
  periodStart: Date;

  @ApiProperty({ description: 'Is limit active' })
  @Column({ default: true })
  isActive: boolean;
}
