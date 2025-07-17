import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';
import { AIAgent } from './ai-agent.entity';

@Entity('ai_agent_tools')
export class AIAgentTool extends BaseEntity {
  @ManyToOne(() => AIAgent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agentId' })
  agent: AIAgent;

  @Column()
  agentId: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ type: 'json', default: {} })
  configuration: Record<string, any>;
}
