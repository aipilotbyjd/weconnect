import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../auth/domain/entities/user.entity';
import { Organization } from '../../../organizations/domain/entities/organization.entity';
import { CredentialShare } from './credential-share.entity';
import { CredentialRotation } from './credential-rotation.entity';

export enum CredentialType {
  API_KEY = 'api_key',
  OAUTH2 = 'oauth2',
  BASIC_AUTH = 'basic_auth',
  BEARER_TOKEN = 'bearer_token',
  DATABASE = 'database',
  EMAIL = 'email',
  WEBHOOK = 'webhook',
  CUSTOM = 'custom',
}

@Schema({ collection: 'credentials' })
export class Credential extends BaseSchema {
  @ApiProperty({ description: 'Credential name', example: 'Gmail API' })
  @Prop()
  name: string;

  @ApiProperty({ description: 'Credential type', enum: CredentialType })
  @Prop({
    type: 'enum',
    enum: CredentialType,
  })
  type: CredentialType;

  @ApiProperty({ description: 'Service name', example: 'gmail' })
  @Prop()
  service: string;

  @ApiProperty({ description: 'Encrypted credential data' })
  @Prop({ type: 'text' })
  encryptedData: string;

  @ApiProperty({ description: 'Credential configuration' })
  @Prop({ type: 'jsonb', default: {} })
  configuration: Record<string, any>;

  @ApiProperty({ description: 'Whether credential is active' })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Last used timestamp' })
  @Prop({ type: 'timestamp with time zone', nullable: true })
  lastUsedAt?: Date;

  @ApiProperty({ description: 'Expiration date for tokens' })
  @Prop({ type: 'timestamp with time zone', nullable: true })
  expiresAt?: Date;

  // Relations
  @ApiProperty({ type: () => User, description: 'Credential owner' })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Prop()
  userId: string;

  // Organization relationship
  @ApiProperty({
    type: () => Organization,
    description: 'Organization this credential belongs to',
  })
  @ManyToOne(() => Organization, (org) => org.credentials)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Prop()
  organizationId: string;

  // Rotation fields
  @ApiProperty({ description: 'When credential was rotated' })
  @Prop({ type: 'timestamp with time zone', nullable: true })
  rotatedAt?: Date;

  @ApiProperty({ description: 'ID of the credential this was rotated to' })
  @Prop('uuid', { nullable: true })
  rotatedToCredentialId?: string;

  // Relations for sharing and rotation
  @ApiProperty({
    type: () => [CredentialShare],
    description: 'Credential shares',
  })
  @OneToMany(() => CredentialShare, (share) => share.credential)
  shares: CredentialShare[];

  @ApiProperty({
    type: () => [CredentialRotation],
    description: 'Credential rotations',
  })
  @OneToMany(() => CredentialRotation, (rotation) => rotation.credential)
  rotations: CredentialRotation[];

  // Credential sharing settings (legacy - kept for backward compatibility)
  @Prop({ type: 'json', nullable: true })
  sharing?: {
    isShared: boolean;
    sharedWith: string[]; // user IDs who can use this credential
  };

  get isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }

  get isRotated(): boolean {
    return !!this.rotatedAt;
  }

  get needsRotation(): boolean {
    // This would be determined by rotation policies
    return false;
  }
}


export const CredentialSchema = SchemaFactory.createForClass(Credential);