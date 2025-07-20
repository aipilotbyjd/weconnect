import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseSchema } from '../../../../core/abstracts/base.schema';
import { ApiProperty } from '@nestjs/swagger';

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

@Schema({ collection: 'workflows' })
export class Workflow extends BaseSchema {
  @ApiProperty({ description: 'Workflow name', example: 'Email Marketing Campaign' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'Workflow description' })
  @Prop()
  description?: string;

  @ApiProperty({ description: 'Workflow status', enum: WorkflowStatus })
  @Prop({ 
    type: String, 
    enum: WorkflowStatus, 
    default: WorkflowStatus.DRAFT 
  })
  status: WorkflowStatus;

  @ApiProperty({ description: 'Workflow configuration JSON' })
  @Prop({ type: Object, default: {} })
  configuration: Record<string, any>;

  @ApiProperty({ description: 'Whether workflow is active' })
  @Prop({ default: false })
  isActive: boolean;

  @ApiProperty({ description: 'Workflow execution count' })
  @Prop({ default: 0 })
  executionCount: number;

  @ApiProperty({ description: 'Last execution timestamp' })
  @Prop()
  lastExecutedAt?: Date;

  @ApiProperty({ description: 'Workflow owner ID' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Organization ID this workflow belongs to' })
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @ApiProperty({ description: 'Workflow sharing settings' })
  @Prop({ 
    type: Object,
    default: { isPublic: false, sharedWith: [] }
  })
  sharing?: {
    isPublic: boolean;
    sharedWith: Types.ObjectId[];
  };

  @ApiProperty({ description: 'Workflow tags' })
  @Prop({ type: [String], default: [] })
  tags?: string[];
}

export const WorkflowSchema = SchemaFactory.createForClass(Workflow);