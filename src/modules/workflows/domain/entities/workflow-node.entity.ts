import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Workflow } from './workflow.entity';
import { WorkflowNodeConnection } from './workflow-node-connection.entity';

export enum NodeType {
  TRIGGER = 'trigger',
  ACTION = 'action',
  CONDITION = 'condition',
  WEBHOOK = 'webhook',
  HTTP_REQUEST = 'http-request',
  EMAIL = 'email',
  DELAY = 'delay',
}

@Entity('workflow_nodes')
export class WorkflowNode extends BaseEntity {
  @ApiProperty({ description: 'Node name', example: 'Send Welcome Email' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Node type', enum: NodeType })
  @Column({
    type: 'enum',
    enum: NodeType,
  })
  type: NodeType;

  @ApiProperty({ description: 'Node configuration JSON' })
  @Column({ type: 'jsonb', default: {} })
  configuration: Record<string, any>;

  @ApiProperty({ description: 'Node position in workflow canvas' })
  @Column({ type: 'jsonb', default: { x: 0, y: 0 } })
  position: { x: number; y: number };

  @ApiProperty({ description: 'Whether node is enabled' })
  @Column({ default: true })
  isEnabled: boolean;

  @ApiProperty({ description: 'Node execution order' })
  @Column({ default: 0 })
  executionOrder: number;

  // Relations
  @ManyToOne(() => Workflow, workflow => workflow.nodes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Column()
  workflowId: string;

  @OneToMany(() => WorkflowNodeConnection, connection => connection.sourceNode)
  outgoingConnections: WorkflowNodeConnection[];

  @OneToMany(() => WorkflowNodeConnection, connection => connection.targetNode)
  incomingConnections: WorkflowNodeConnection[];
}
