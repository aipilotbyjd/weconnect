import { Entity, Column, Index, CreateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('system_metrics')
@Index(['recordedAt'])
export class SystemMetric extends BaseEntity {
  @ApiProperty({ description: 'CPU usage percentage' })
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  cpuUsage: number;

  @ApiProperty({ description: 'Memory usage in bytes' })
  @Column({ type: 'bigint' })
  memoryUsage: number;

  @ApiProperty({ description: 'Total memory in bytes' })
  @Column({ type: 'bigint' })
  memoryTotal: number;

  @ApiProperty({ description: 'Free memory in bytes' })
  @Column({ type: 'bigint' })
  memoryFree: number;

  @ApiProperty({ description: 'Load average' })
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  loadAverage: number;

  @ApiProperty({ description: 'Active database connections' })
  @Column({ default: 0 })
  activeConnections: number;

  @ApiProperty({ description: 'Queue size' })
  @Column({ default: 0 })
  queueSize: number;

  @CreateDateColumn()
  recordedAt: Date;
}
