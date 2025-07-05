import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';
import { AIAgent } from './ai-agent.entity';

export enum MemoryType {
  CONVERSATION = 'conversation',
  ENTITY = 'entity',
  SUMMARY = 'summary',
  VECTOR = 'vector'
}

@Entity('ai_agent_memory')
export class AIAgentMemory extends BaseEntity {
  @ManyToOne(() => AIAgent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'agentId' })
  agent: AIAgent;

  @Column()
  agentId: string;

  @Column()
  sessionId: string;

  @Column({
    type: 'enum',
    enum: MemoryType
  })
  type: MemoryType;

  @Column()
  key: string;

  @Column({ type: 'json' })
  data: any;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;
}
