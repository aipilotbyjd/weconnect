import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseSchema } from '../../../../core/abstracts/base.schema';
import { ApiProperty } from '@nestjs/swagger';

export enum VariableType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  OBJECT = 'object',
  ARRAY = 'array',
  SECRET = 'secret',
}

@Schema({ collection: 'workflow_variables' })
export class WorkflowVariable extends BaseSchema {
  @ApiProperty({ description: 'Variable name/key' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'Variable display name' })
  @Prop()
  displayName?: string;

  @ApiProperty({ description: 'Variable type', enum: VariableType })
  @Prop({ type: String, enum: VariableType, default: VariableType.STRING })
  type: VariableType;

  @ApiProperty({ description: 'Variable value' })
  @Prop({ type: Object })
  value: any;

  @ApiProperty({ description: 'Whether variable is encrypted' })
  @Prop({ default: false })
  isEncrypted: boolean;

  @ApiProperty({ description: 'Variable description' })
  @Prop()
  description?: string;

  @ApiProperty({ description: 'Workflow ID this variable belongs to' })
  @Prop({ type: Types.ObjectId, ref: 'Workflow', required: true })
  workflowId: Types.ObjectId;

  @ApiProperty({ description: 'Whether variable is required' })
  @Prop({ default: false })
  required: boolean;

  @ApiProperty({ description: 'Default value for the variable' })
  @Prop({ type: Object })
  defaultValue?: any;

  @ApiProperty({ description: 'Variable validation rules' })
  @Prop({ type: Object })
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

export const WorkflowVariableSchema = SchemaFactory.createForClass(WorkflowVariable);