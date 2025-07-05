import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../auth/domain/entities/user.entity';

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

@Entity('credentials')
export class Credential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'enum', enum: CredentialType })
  type: CredentialType;

  @Column({ type: 'enum', enum: ServiceType })
  service: ServiceType;

  @Column({ type: 'text', nullable: true })
  description?: string;

  // Encrypted credential data (API keys, tokens, etc.)
  @Column({ type: 'text' })
  encryptedData: string;

  // OAuth2 specific fields
  @Column({ type: 'text', nullable: true })
  refreshToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'json', nullable: true })
  scopes?: string[];

  // Additional metadata
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
