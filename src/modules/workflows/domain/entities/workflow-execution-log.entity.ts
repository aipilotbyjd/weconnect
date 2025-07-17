import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { WorkflowExecution } from './workflow-execution.entity';
import { WorkflowNode } from './workflow-node.entity';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

@Entity('workflow_execution_logs')
export class WorkflowExecutionLog extends BaseEntity {
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

  @ApiProperty({ description: 'Log data' })
  @Column({ type: 'json', nullable: true })
  data?: Record<string, any>;

  @ApiProperty({ description: 'Node input data' })
  @Column({ type: 'json', nullable: true })
  nodeInput?: Record<string, any>;

  @ApiProperty({ description: 'Node output data' })
  @Column({ type: 'json', nullable: true })
  nodeOutput?: Record<string, any>;

  @ApiProperty({ description: 'Execution time in ms' })
  @Column({ nullable: true })
  executionTime?: number;

  // Relations
  @ManyToOne(() => WorkflowExecution, (execution) => execution.logs, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'executionId' })
  execution: WorkflowExecution;

  @Column()
  executionId: string;

  @ManyToOne(() => WorkflowNode, { nullable: true })
  @JoinColumn({ name: 'nodeId' })
  node?: WorkflowNode;

  @Column({ nullable: true })
  nodeId?: string;
}
