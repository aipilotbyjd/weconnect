import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseSchema } from '../../../../core/abstracts/base.schema';
import { ApiProperty } from '@nestjs/swagger';

export enum NodeType {
  TRIGGER = 'trigger',
  ACTION = 'action',
  CONDITION = 'condition',
  WEBHOOK = 'webhook',
  EMAIL = 'email',
  HTTP_REQUEST = 'http_request',
  DELAY = 'delay',
  SLACK = 'slack',
  DISCORD = 'discord',
  GMAIL = 'gmail',
  TELEGRAM = 'telegram',
  GITHUB = 'github',
  GOOGLE_SHEETS = 'google_sheets',
  TRELLO = 'trello',
  MONGODB = 'mongodb',
  MYSQL = 'mysql',
  REDIS = 'redis',
}

@Schema({ collection: 'workflow_nodes' })
export class WorkflowNode extends BaseSchema {
  @ApiProperty({ description: 'Node name' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'Node type', enum: NodeType })
  @Prop({ type: String, enum: NodeType, required: true })
  type: NodeType;

  @ApiProperty({ description: 'Node position in workflow' })
  @Prop({ type: Object, required: true })
  position: {
    x: number;
    y: number;
  };

  @ApiProperty({ description: 'Node configuration' })
  @Prop({ type: Object, default: {} })
  configuration: Record<string, any>;

  @ApiProperty({ description: 'Node parameters' })
  @Prop({ type: Object, default: {} })
  parameters: Record<string, any>;

  @ApiProperty({ description: 'Whether node is disabled' })
  @Prop({ default: false })
  disabled: boolean;

  @ApiProperty({ description: 'Node execution timeout in seconds' })
  @Prop({ default: 300 })
  timeout: number;

  @ApiProperty({ description: 'Number of retry attempts' })
  @Prop({ default: 0 })
  retryAttempts: number;

  @ApiProperty({ description: 'Workflow ID this node belongs to' })
  @Prop({ type: Types.ObjectId, ref: 'Workflow', required: true })
  workflowId: Types.ObjectId;

  @ApiProperty({ description: 'Node credentials reference' })
  @Prop({ type: Types.ObjectId, ref: 'Credential' })
  credentialId?: Types.ObjectId;

  @ApiProperty({ description: 'Node notes/description' })
  @Prop()
  notes?: string;

  @ApiProperty({ description: 'Node color for UI' })
  @Prop({ default: '#1f77b4' })
  color: string;
}

export const WorkflowNodeSchema = SchemaFactory.createForClass(WorkflowNode);