import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseSchema } from '../../../../core/abstracts/base.schema';
import { ApiProperty } from '@nestjs/swagger';

export enum SharePermission {
  READ = 'read',
  USE = 'use',
  ADMIN = 'admin',
}

@Schema({ collection: 'credential_shares' })
export class CredentialShare extends BaseSchema {
  @ApiProperty({ description: 'Credential ID being shared' })
  @Prop({ type: Types.ObjectId, ref: 'Credential', required: true })
  credentialId: Types.ObjectId;

  @ApiProperty({ description: 'User ID the credential is shared with' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sharedWithUserId: Types.ObjectId;

  @ApiProperty({ description: 'User ID who shared the credential' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sharedByUserId: Types.ObjectId;

  @ApiProperty({ description: 'Share permission level', enum: SharePermission })
  @Prop({ type: String, enum: SharePermission, default: SharePermission.USE })
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

  @ApiProperty({ description: 'Last time shared credential was used' })
  @Prop()
  lastUsedAt?: Date;

  @ApiProperty({ description: 'Usage count' })
  @Prop({ default: 0 })
  usageCount: number;
}

export const CredentialShareSchema = SchemaFactory.createForClass(CredentialShare);