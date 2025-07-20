import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';import { AIAgent } from './ai-agent.entity';

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Schema({ collection: 'ai_agent_executions' })
export class AIAgentExecution extends BaseSchema {
  @ManyToOne(() => AIAgent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agentId' })
  agent: AIAgent;

  @Prop()
  agentId: string;

  @Prop()
  workflowExecutionId: string;

  @Prop()
  nodeId: string;

  @Prop({ type: 'json' })
  inputData: any;

  @Prop({ type: 'json', nullable: true })
  outputData: any;

  @Prop({
    type: 'enum',
    enum: ExecutionStatus,
    default: ExecutionStatus.PENDING,
  })
  status: ExecutionStatus;

  @Prop({ nullable: true })
  error: string;

  @Prop({ type: 'json', nullable: true })
  metadata: any;

  @Prop({ nullable: true })
  tokensUsed: number;

  @Prop({ nullable: true })
  executionTime: number;

  @Prop({ type: 'timestamp', nullable: true })
  startedAt: Date;

  @Prop({ type: 'timestamp', nullable: true })
  completedAt: Date;
}


export const AIAgentExecutionSchema = SchemaFactory.createForClass(AIAgentExecution);