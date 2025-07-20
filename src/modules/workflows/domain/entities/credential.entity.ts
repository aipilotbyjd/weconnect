import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { User } from '../../../auth/domain/entities/user.entity';

export enum CredentialType {
  API_KEY = 'api_key',
  OAUTH2 = 'oauth2',
  BASIC_AUTH = 'basic_auth',
  BEARER_TOKEN = 'bearer_token',
}

export enum ServiceType {
  SLACK = 'slack',
  DISCORD = 'discord',
  GMAIL = 'gmail',
  GITHUB = 'github',
  GOOGLE_SHEETS = 'google_sheets',
  TELEGRAM = 'telegram',
  TRELLO = 'trello',
  SMTP = 'smtp',
  WEBHOOK = 'webhook',
  HTTP = 'http',
}

@Schema({ collection: 'credentials' })
export class Credential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Prop({ type: 'varchar', length: 255 })
  name: string;

  @Prop({ type: 'enum', enum: CredentialType })
  type: CredentialType;

  @Prop({ type: 'enum', enum: ServiceType })
  service: ServiceType;

  @Prop({ type: 'text', nullable: true })
  description?: string;

  // Encrypted credential data (API keys, tokens, etc.)
  @Prop({ type: 'text' })
  encryptedData: string;

  // OAuth2 specific fields
  @Prop({ type: 'text', nullable: true })
  refreshToken?: string;

  @Prop({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Prop({ type: 'json', nullable: true })
  scopes?: string[];

  // Additional metadata
  @Prop({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Prop({ type: 'boolean', default: true })
  isActive: boolean;

  @Prop({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


export const CredentialSchema = SchemaFactory.createForClass(Credential);