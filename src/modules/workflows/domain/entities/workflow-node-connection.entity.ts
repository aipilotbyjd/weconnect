import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseSchema } from '../../../../core/abstracts/base.schema';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ collection: 'workflow_node_connections' })
export class WorkflowNodeConnection extends BaseSchema {
  @ApiProperty({ description: 'Source node ID' })
  @Prop({ type: Types.ObjectId, ref: 'WorkflowNode', required: true })
  sourceNodeId: Types.ObjectId;

  @ApiProperty({ description: 'Target node ID' })
  @Prop({ type: Types.ObjectId, ref: 'WorkflowNode', required: true })
  targetNodeId: Types.ObjectId;

  @ApiProperty({ description: 'Source output port' })
  @Prop({ default: 'main' })
  sourceOutput: string;

  @ApiProperty({ description: 'Target input port' })
  @Prop({ default: 'main' })
  targetInput: string;

  @ApiProperty({ description: 'Workflow ID this connection belongs to' })
  @Prop({ type: Types.ObjectId, ref: 'Workflow', required: true })
  workflowId: Types.ObjectId;

  @ApiProperty({ description: 'Connection condition/rule' })
  @Prop({ type: Object })
  condition?: {
    type: 'always' | 'expression' | 'value';
    expression?: string;
    value?: any;
  };

  @ApiProperty({ description: 'Whether connection is disabled' })
  @Prop({ default: false })
  disabled: boolean;
}

export const WorkflowNodeConnectionSchema = SchemaFactory.createForClass(WorkflowNodeConnection);