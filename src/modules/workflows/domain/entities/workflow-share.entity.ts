import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';import { ApiProperty } from '@nestjs/swagger';
import { Workflow } from './workflow.entity';
import { User } from '../../../auth/domain/entities/user.entity';
import { Organization } from '../../../organizations/domain/entities/organization.entity';

export enum SharePermission {
  VIEW = 'view',
  EXECUTE = 'execute',
  EDIT = 'edit',
  ADMIN = 'admin',
}

export enum ShareType {
  USER = 'user',
  ORGANIZATION = 'organization',
  PUBLIC_LINK = 'public_link',
}

@Schema({ collection: 'workflow_shares' })
export class WorkflowShare extends BaseSchema {
  @ApiProperty({ description: 'Share type', enum: ShareType })
  @Prop({
    type: 'enum',
    enum: ShareType,
  })
  shareType: ShareType;

  @ApiProperty({ description: 'Permission level', enum: SharePermission })
  @Prop({
    type: 'enum',
    enum: SharePermission,
    default: SharePermission.VIEW,
  })
  permission: SharePermission;

  @ApiProperty({ description: 'Share expiration date' })
  @Prop({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @ApiProperty({ description: 'Public share token' })
  @Prop({ nullable: true, unique: true })
  shareToken?: string;

  @ApiProperty({ description: 'Share message/note' })
  @Prop({ type: 'text', nullable: true })
  message?: string;

  @ApiProperty({ description: 'Number of times accessed' })
  @Prop({ default: 0 })
  accessCount: number;

  @ApiProperty({ description: 'Last accessed timestamp' })
  @Prop({ type: 'timestamp', nullable: true })
  lastAccessedAt?: Date;

  // Relations
  @ManyToOne(() => Workflow, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Prop()
  workflowId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sharedById' })
  sharedBy: User;

  @Prop()
  sharedById: string;

  @Prop({ nullable: true })
  sharedWithId?: string; // User ID or Organization ID

  @CreateDateColumn()
  sharedAt: Date;
}


export const WorkflowShareSchema = SchemaFactory.createForClass(WorkflowShare);