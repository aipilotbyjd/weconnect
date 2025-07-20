import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';import { AIAgent } from './ai-agent.entity';

export enum MemoryType {
  CONVERSATION = 'conversation',
  ENTITY = 'entity',
  SUMMARY = 'summary',
  VECTOR = 'vector',
}

@Schema({ collection: 'ai_agent_memory' })
export class AIAgentMemory extends BaseSchema {
  @ManyToOne(() => AIAgent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agentId' })
  agent: AIAgent;

  @Prop()
  agentId: string;

  @Prop()
  sessionId: string;

  @Prop({
    type: 'enum',
    enum: MemoryType,
  })
  type: MemoryType;

  @Prop()
  key: string;

  @Prop({ type: 'json' })
  data: any;

  @Prop({ type: 'timestamp', nullable: true })
  expiresAt: Date;
}


export const AIAgentMemorySchema = SchemaFactory.createForClass(AIAgentMemory);