import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';import { AIAgent } from './ai-agent.entity';

@Schema({ collection: 'ai_agent_tools' })
export class AIAgentTool extends BaseSchema {
  @ManyToOne(() => AIAgent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agentId' })
  agent: AIAgent;

  @Prop()
  agentId: string;

  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop({ type: 'json', default: {} })
  configuration: Record<string, any>;
}


export const AIAgentToolSchema = SchemaFactory.createForClass(AIAgentTool);