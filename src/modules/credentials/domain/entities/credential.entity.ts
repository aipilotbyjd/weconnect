import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BaseSchema } from '../../../../core/abstracts/base.schema';
import { ApiProperty } from '@nestjs/swagger';

export enum CredentialType {
  API_KEY = 'api_key',
  OAUTH2 = 'oauth2',
  BASIC_AUTH = 'basic_auth',
  JWT = 'jwt',
  CUSTOM = 'custom',
  DATABASE = 'database',
  EMAIL = 'email',
  FTP = 'ftp',
  SSH = 'ssh',
}

@Schema({ collection: 'credentials' })
export class Credential extends BaseSchema {
  @ApiProperty({ description: 'Credential name' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'Credential type', enum: CredentialType })
  @Prop({ type: String, enum: CredentialType, required: true })
  type: CredentialType;

  @ApiProperty({ description: 'Service/platform this credential is for' })
  @Prop({ required: true })
  service: string;

  @ApiProperty({ description: 'Encrypted credential data' })
  @Prop({ type: Object, required: true })
  data: Record<string, any>;

  @ApiProperty({ description: 'User ID who owns this credential' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Organization ID this credential belongs to' })
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @ApiProperty({ description: 'Whether credential is active' })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Credential description' })
  @Prop()
  description?: string;

  @ApiProperty({ description: 'Last time credential was used' })
  @Prop()
  lastUsedAt?: Date;

  @ApiProperty({ description: 'Credential expiration date' })
  @Prop()
  expiresAt?: Date;

  @ApiProperty({ description: 'Credential tags' })
  @Prop({ type: [String], default: [] })
  tags: string[];

  @ApiProperty({ description: 'OAuth2 specific data' })
  @Prop({ type: Object })
  oauth2Data?: {
    accessToken?: string;
    refreshToken?: string;
    tokenType?: string;
    expiresIn?: number;
    scope?: string;
    clientId?: string;
    clientSecret?: string;
    authUrl?: string;
    tokenUrl?: string;
  };

  @ApiProperty({ description: 'Whether credential needs refresh' })
  @Prop({ default: false })
  needsRefresh: boolean;

  @ApiProperty({ description: 'Last refresh attempt' })
  @Prop()
  lastRefreshAt?: Date;

  @ApiProperty({ description: 'Number of refresh failures' })
  @Prop({ default: 0 })
  refreshFailures: number;
}

export const CredentialSchema = SchemaFactory.createForClass(Credential);