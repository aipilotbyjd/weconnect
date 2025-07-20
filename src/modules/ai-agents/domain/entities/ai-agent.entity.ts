import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';@Schema({ collection: 'ai_agents' })
export class AIAgent extends BaseSchema {
  @Prop()
  name: string;

  @Prop('text')
  description: string;

  @Prop()
  provider: string;

  @Prop()
  model: string;

  @Prop({ type: 'json', default: {} })
  configuration: Record<string, any>;
}


export const AIAgentSchema = SchemaFactory.createForClass(AIAgent);