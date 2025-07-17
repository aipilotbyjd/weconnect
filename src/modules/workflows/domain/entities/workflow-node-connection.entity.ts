import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { WorkflowNode } from './workflow-node.entity';

export enum ConnectionType {
  MAIN = 'main',
  ERROR = 'error',
  TRUE = 'true',
  FALSE = 'false',
}

@Entity('workflow_node_connections')
export class WorkflowNodeConnection extends BaseEntity {
  @ApiProperty({ description: 'Connection type', enum: ConnectionType })
  @Column({
    type: 'enum',
    enum: ConnectionType,
    default: ConnectionType.MAIN,
  })
  type: ConnectionType;

  @ApiProperty({ description: 'Source output index' })
  @Column({ default: 0 })
  sourceOutputIndex: number;

  @ApiProperty({ description: 'Target input index' })
  @Column({ default: 0 })
  targetInputIndex: number;

  @ApiProperty({ description: 'Connection condition' })
  @Column({ type: 'json', nullable: true })
  condition?: Record<string, any>;

  // Relations
  @ManyToOne(() => WorkflowNode, (node) => node.outgoingConnections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sourceNodeId' })
  sourceNode: WorkflowNode;

  @Column()
  sourceNodeId: string;

  @ManyToOne(() => WorkflowNode, (node) => node.incomingConnections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'targetNodeId' })
  targetNode: WorkflowNode;

  @Column()
  targetNodeId: string;
}
