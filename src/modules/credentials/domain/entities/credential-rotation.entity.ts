import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseSchema } from '../../../../core/abstracts/base.schema';
import { ApiProperty } from '@nestjs/swagger';

export enum RotationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum RotationFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}

@Schema({ collection: 'credential_rotations' })
export class CredentialRotation extends BaseSchema {
  @ApiProperty({ description: 'Credential ID to rotate' })
  @Prop({ type: Types.ObjectId, ref: 'Credential', required: true })
  credentialId: Types.ObjectId;

  @ApiProperty({ description: 'Rotation frequency', enum: RotationFrequency })
  @Prop({ type: String, enum: RotationFrequency, required: true })
  frequency: RotationFrequency;

  @ApiProperty({ description: 'Custom rotation interval in days' })
  @Prop()
  customIntervalDays?: number;

  @ApiProperty({ description: 'Next scheduled rotation date' })
  @Prop({ required: true })
  nextRotationAt: Date;

  @ApiProperty({ description: 'Last rotation date' })
  @Prop()
  lastRotationAt?: Date;

  @ApiProperty({ description: 'Current rotation status', enum: RotationStatus })
  @Prop({ type: String, enum: RotationStatus, default: RotationStatus.PENDING })
  status: RotationStatus;

  @ApiProperty({ description: 'Whether automatic rotation is enabled' })
  @Prop({ default: true })
  isEnabled: boolean;

  @ApiProperty({ description: 'Rotation configuration' })
  @Prop({ type: Object, default: {} })
  config: {
    notifyBeforeDays?: number;
    backupOldCredential?: boolean;
    testAfterRotation?: boolean;
    rollbackOnFailure?: boolean;
  };

  @ApiProperty({ description: 'Last rotation attempt details' })
  @Prop({ type: Object })
  lastAttempt?: {
    startedAt: Date;
    completedAt?: Date;
    error?: string;
    oldCredentialBackup?: any;
    newCredentialData?: any;
  };

  @ApiProperty({ description: 'Number of consecutive failures' })
  @Prop({ default: 0 })
  failureCount: number;

  @ApiProperty({ description: 'Maximum allowed failures before disabling' })
  @Prop({ default: 3 })
  maxFailures: number;

  @ApiProperty({ description: 'User IDs to notify on rotation events' })
  @Prop({ type: [Types.ObjectId], default: [] })
  notifyUserIds: Types.ObjectId[];

  @ApiProperty({ description: 'Webhook URLs to call on rotation events' })
  @Prop({ type: [String], default: [] })
  webhookUrls: string[];
}

export const CredentialRotationSchema = SchemaFactory.createForClass(CredentialRotation);