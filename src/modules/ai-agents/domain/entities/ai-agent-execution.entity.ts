import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';
import { AIAgent } from './ai-agent.entity';

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

@Entity('ai_agent_executions')
export class AIAgentExecution extends BaseEntity {
  @ManyToOne(() => AIAgent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agentId' })
  agent: AIAgent;

  @Column()
  agentId: string;

  @Column()
  workflowExecutionId: string;

  @Column()
  nodeId: string;

  @Column({ type: 'json' })
  inputData: any;

  @Column({ type: 'json', nullable: true })
  outputData: any;

  @Column({
    type: 'enum',
    enum: ExecutionStatus,
    default: ExecutionStatus.PENDING
  })
  status: ExecutionStatus;

  @Column({ nullable: true })
  error: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @Column({ nullable: true })
  tokensUsed: number;

  @Column({ nullable: true })
  executionTime: number;

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;
}
