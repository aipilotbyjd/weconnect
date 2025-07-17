import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';

@Entity('ai_agents')
export class AIAgent extends BaseEntity {
  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column()
  provider: string;

  @Column()
  model: string;

  @Column({ type: 'json', default: {} })
  configuration: Record<string, any>;
}
