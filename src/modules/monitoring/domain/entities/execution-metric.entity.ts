import { Entity, Column, Index, CreateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('execution_metrics')
@Index(['workflowId', 'createdAt'])
@Index(['nodeId', 'createdAt'])
@Index(['executionId'])
export class ExecutionMetric extends BaseEntity {
  @ApiProperty({ description: 'Workflow ID' })
  @Column()
  workflowId: string;

  @ApiProperty({ description: 'Execution ID' })
  @Column()
  executionId: string;

  @ApiProperty({ description: 'Node ID (optional)' })
  @Column({ nullable: true })
  nodeId?: string;

  @ApiProperty({ description: 'Execution duration in milliseconds' })
  @Column()
  duration: number;

  @ApiProperty({ description: 'Memory usage in bytes' })
  @Column({ type: 'bigint', nullable: true })
  memoryUsage?: number;

  @ApiProperty({ description: 'CPU usage percentage' })
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  cpuUsage?: number;

  @ApiProperty({ description: 'Number of items processed' })
  @Column({ default: 0 })
  itemsProcessed: number;

  @ApiProperty({ description: 'Was execution successful' })
  @Column()
  success: boolean;

  @ApiProperty({ description: 'Error message if failed' })
  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @ApiProperty({ description: 'Execution mode' })
  @Column()
  mode: string;

  @ApiProperty({ description: 'User ID' })
  @Column()
  userId: string;

  @ApiProperty({ description: 'Organization ID' })
  @Column({ nullable: true })
  organizationId?: string;

  @CreateDateColumn()
  recordedAt: Date;
}
