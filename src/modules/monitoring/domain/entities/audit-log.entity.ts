import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';import { ApiProperty } from '@nestjs/swagger';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
  SHARE = 'share',
  EXPORT = 'export',
  IMPORT = 'import',
  LOGIN = 'login',
  LOGOUT = 'logout',
  API_ACCESS = 'api_access',
}

@Schema({ collection: 'audit_logs' })
export class AuditLog extends BaseSchema {
  @ApiProperty({ description: 'Action performed', enum: AuditAction })
  @Prop({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @ApiProperty({ description: 'Entity type affected' })
  @Prop()
  entityType: string;

  @ApiProperty({ description: 'Entity ID affected' })
  @Prop()
  entityId: string;

  @ApiProperty({ description: 'User who performed the action' })
  @Prop()
  userId: string;

  @ApiProperty({ description: 'User email for quick reference' })
  @Prop()
  userEmail: string;

  @ApiProperty({ description: 'IP address' })
  @Prop({ nullable: true })
  ipAddress?: string;

  @ApiProperty({ description: 'User agent' })
  @Prop({ type: 'text', nullable: true })
  userAgent?: string;

  @ApiProperty({ description: 'Changes made (for updates)' })
  @Prop({ type: 'jsonb', nullable: true })
  changes?: Record<string, any>;

  @ApiProperty({ description: 'Additional metadata' })
  @Prop({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Organization ID' })
  @Prop({ nullable: true })
  organizationId?: string;

  @CreateDateColumn()
  performedAt: Date;
}


export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);