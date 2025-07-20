import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseSchema } from '../../../../core/abstracts/base.schema';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ collection: 'workflow_versions' })
export class WorkflowVersion extends BaseSchema {
  @ApiProperty({ description: 'Version number' })
  @Prop({ required: true })
  version: number;

  @ApiProperty({ description: 'Version name/tag' })
  @Prop()
  name?: string;

  @ApiProperty({ description: 'Version description' })
  @Prop()
  description?: string;

  @ApiProperty({ description: 'Workflow ID this version belongs to' })
  @Prop({ type: Types.ObjectId, ref: 'Workflow', required: true })
  workflowId: Types.ObjectId;

  @ApiProperty({ description: 'Workflow data snapshot' })
  @Prop({ type: Object, required: true })
  workflowData: {
    name: string;
    description?: string;
    configuration: Record<string, any>;
    nodes: any[];
    connections: any[];
    variables: any[];
  };

  @ApiProperty({ description: 'User who created this version' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @ApiProperty({ description: 'Whether this is the active version' })
  @Prop({ default: false })
  isActive: boolean;

  @ApiProperty({ description: 'Version changelog' })
  @Prop()
  changelog?: string;

  @ApiProperty({ description: 'Version tags' })
  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const WorkflowVersionSchema = SchemaFactory.createForClass(WorkflowVersion);