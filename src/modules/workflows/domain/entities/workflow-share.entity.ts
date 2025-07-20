import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseSchema } from '../../../../core/abstracts/base.schema';
import { ApiProperty } from '@nestjs/swagger';

export enum SharePermission {
  VIEW = 'view',
  EDIT = 'edit',
  EXECUTE = 'execute',
  ADMIN = 'admin',
}

@Schema({ collection: 'workflow_shares' })
export class WorkflowShare extends BaseSchema {
  @ApiProperty({ description: 'Workflow ID being shared' })
  @Prop({ type: Types.ObjectId, ref: 'Workflow', required: true })
  workflowId: Types.ObjectId;

  @ApiProperty({ description: 'User ID the workflow is shared with' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sharedWithUserId: Types.ObjectId;

  @ApiProperty({ description: 'User ID who shared the workflow' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sharedByUserId: Types.ObjectId;

  @ApiProperty({ description: 'Share permission level', enum: SharePermission })
  @Prop({ type: String, enum: SharePermission, default: SharePermission.VIEW })
  permission: SharePermission;

  @ApiProperty({ description: 'Share expiration date' })
  @Prop()
  expiresAt?: Date;

  @ApiProperty({ description: 'Whether the share is active' })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Share message/note' })
  @Prop()
  message?: string;
}

export const WorkflowShareSchema = SchemaFactory.createForClass(WorkflowShare);