import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../abstracts/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Execution } from './execution.entity';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

@Entity('execution_logs')
export class ExecutionLog extends BaseEntity {
  @ApiProperty({ description: 'Log level', enum: LogLevel })
  @Column({
    type: 'enum',
    enum: LogLevel,
    default: LogLevel.INFO,
  })
  level: LogLevel;

  @ApiProperty({ description: 'Log message' })
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({ description: 'Node ID that generated this log' })
  @Column({ nullable: true })
  nodeId?: string;

  @ApiProperty({ description: 'Node name' })
  @Column({ nullable: true })
  nodeName?: string;

  @ApiProperty({ description: 'Additional log data' })
  @Column({ type: 'jsonb', default: {} })
  data: Record<string, any>;

  @ApiProperty({ description: 'Execution duration for this step in ms' })
  @Column({ type: 'int', nullable: true })
  duration?: number;

  // Relations
  @ManyToOne(() => Execution, execution => execution.logs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'executionId' })
  execution: Execution;

  @Column()
  executionId: string;
}
