import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';import { ApiProperty } from '@nestjs/swagger';
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
  GMAIL = 'gmail',
  SLACK = 'slack',
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
  GITHUB = 'github',
  GOOGLE_SHEETS = 'google-sheets',
  TRELLO = 'trello',
  AI_AGENT = 'ai-agent',
}

@Schema({ collection: 'workflow_nodes' })
export class WorkflowNode extends BaseSchema {
  @ApiProperty({ description: 'Node name', example: 'Send Welcome Email' })
  @Prop()
  name: string;

  @ApiProperty({ description: 'Node type', enum: NodeType })
  @Prop({
    type: 'enum',
    enum: NodeType,
  })
  type: NodeType;

  @ApiProperty({ description: 'Node configuration JSON' })
  @Prop({ type: 'jsonb', default: {} })
  configuration: Record<string, any>;

  @ApiProperty({ description: 'Node position in workflow canvas' })
  @Prop({ type: 'jsonb', default: { x: 0, y: 0 } })
  position: { x: number; y: number };

  @ApiProperty({ description: 'Whether node is enabled' })
  @Prop({ default: true })
  isEnabled: boolean;

  @ApiProperty({ description: 'Node execution order' })
  @Prop({ default: 0 })
  executionOrder: number;

  // Relations
  @ApiProperty({
    type: () => Workflow,
    description: 'Workflow this node belongs to',
  })
  @ManyToOne(() => Workflow, (workflow) => workflow.nodes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Prop()
  workflowId: string;

  @ApiProperty({
    type: () => [WorkflowNodeConnection],
    description: 'Outgoing connections',
  })
  @OneToMany(
    () => WorkflowNodeConnection,
    (connection) => connection.sourceNode,
  )
  outgoingConnections: WorkflowNodeConnection[];

  @ApiProperty({
    type: () => [WorkflowNodeConnection],
    description: 'Incoming connections',
  })
  @OneToMany(
    () => WorkflowNodeConnection,
    (connection) => connection.targetNode,
  )
  incomingConnections: WorkflowNodeConnection[];
}


export const WorkflowNodeSchema = SchemaFactory.createForClass(WorkflowNode);