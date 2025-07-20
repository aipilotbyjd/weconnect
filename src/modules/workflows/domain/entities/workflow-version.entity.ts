import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';import { ApiProperty } from '@nestjs/swagger';
import { Workflow } from './workflow.entity';

@Schema({ collection: 'workflow_versions' })
export class WorkflowVersion extends BaseSchema {
  @ApiProperty({ description: 'Version number' })
  @Prop()
  declare version: number;

  @ApiProperty({ description: 'Version name/tag' })
  @Prop({ nullable: true })
  name?: string;

  @ApiProperty({ description: 'Version description' })
  @Prop({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Workflow definition at this version' })
  @Prop({ type: 'jsonb' })
  definition: Record<string, any>;

  @ApiProperty({ description: 'Workflow configuration at this version' })
  @Prop({ type: 'jsonb', nullable: true })
  configuration?: Record<string, any>;

  @ApiProperty({ description: 'Is this the active version' })
  @Prop({ default: false })
  isActive: boolean;

  @ApiProperty({ description: 'Is this version published' })
  @Prop({ default: false })
  isPublished: boolean;

  @ApiProperty({ description: 'Changelog/commit message' })
  @Prop({ type: 'text', nullable: true })
  changelog?: string;

  @ApiProperty({ description: 'User who created this version' })
  @Prop()
  createdBy: string;

  @ApiProperty({ description: 'Previous version ID' })
  @Prop({ nullable: true })
  previousVersionId?: string;

  // Relations
  @ManyToOne(() => Workflow, (workflow) => workflow.versions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Prop()
  workflowId: string;
}


export const WorkflowVersionSchema = SchemaFactory.createForClass(WorkflowVersion);