import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';import { ApiProperty } from '@nestjs/swagger';
import { Workflow } from './workflow.entity';

export enum VariableType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
  SECRET = 'secret',
}

export enum VariableScope {
  WORKFLOW = 'workflow',
  GLOBAL = 'global',
  ORGANIZATION = 'organization',
}

@Schema({ collection: 'workflow_variables' })
export class WorkflowVariable extends BaseSchema {
  @ApiProperty({ description: 'Variable name' })
  @Prop()
  name: string;

  @ApiProperty({ description: 'Variable value' })
  @Prop({ type: 'text', nullable: true })
  value: string;

  @ApiProperty({ description: 'Variable type', enum: VariableType })
  @Prop({
    type: 'enum',
    enum: VariableType,
    default: VariableType.STRING,
  })
  type: VariableType;

  @ApiProperty({ description: 'Variable scope', enum: VariableScope })
  @Prop({
    type: 'enum',
    enum: VariableScope,
    default: VariableScope.WORKFLOW,
  })
  scope: VariableScope;

  @ApiProperty({ description: 'Variable description' })
  @Prop({ nullable: true })
  description?: string;

  @ApiProperty({ description: 'Is secret/encrypted' })
  @Prop({ default: false })
  isSecret: boolean;

  @ApiProperty({ description: 'Is system variable' })
  @Prop({ default: false })
  isSystem: boolean;

  // Relations
  @ManyToOne(() => Workflow, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowId' })
  workflow?: Workflow;

  @Prop({ nullable: true })
  workflowId?: string;

  @Prop()
  userId: string;

  @Prop({ nullable: true })
  organizationId?: string;
}


export const WorkflowVariableSchema = SchemaFactory.createForClass(WorkflowVariable);