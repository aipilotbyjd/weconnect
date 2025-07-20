import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';import { ApiProperty } from '@nestjs/swagger';
import { WorkflowNode } from './workflow-node.entity';

export enum ConnectionType {
  MAIN = 'main',
  ERROR = 'error',
  TRUE = 'true',
  FALSE = 'false',
}

@Schema({ collection: 'workflow_node_connections' })
export class WorkflowNodeConnection extends BaseSchema {
  @ApiProperty({ description: 'Connection type', enum: ConnectionType })
  @Prop({
    type: 'enum',
    enum: ConnectionType,
    default: ConnectionType.MAIN,
  })
  type: ConnectionType;

  @ApiProperty({ description: 'Source output index' })
  @Prop({ default: 0 })
  sourceOutputIndex: number;

  @ApiProperty({ description: 'Target input index' })
  @Prop({ default: 0 })
  targetInputIndex: number;

  @ApiProperty({ description: 'Connection condition' })
  @Prop({ type: 'json', nullable: true })
  condition?: Record<string, any>;

  // Relations
  @ManyToOne(() => WorkflowNode, (node) => node.outgoingConnections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sourceNodeId' })
  sourceNode: WorkflowNode;

  @Prop()
  sourceNodeId: string;

  @ManyToOne(() => WorkflowNode, (node) => node.incomingConnections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'targetNodeId' })
  targetNode: WorkflowNode;

  @Prop()
  targetNodeId: string;
}


export const WorkflowNodeConnectionSchema = SchemaFactory.createForClass(WorkflowNodeConnection);