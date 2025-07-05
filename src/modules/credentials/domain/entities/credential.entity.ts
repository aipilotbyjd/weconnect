import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../auth/domain/entities/user.entity';
import { Organization } from '../../../organizations/domain/entities/organization.entity';

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

@Entity('credentials')
export class Credential extends BaseEntity {
  @ApiProperty({ description: 'Credential name', example: 'Gmail API' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Credential type', enum: CredentialType })
  @Column({
    type: 'enum',
    enum: CredentialType,
  })
  type: CredentialType;

  @ApiProperty({ description: 'Service name', example: 'gmail' })
  @Column()
  service: string;

  @ApiProperty({ description: 'Encrypted credential data' })
  @Column({ type: 'text' })
  encryptedData: string;

  @ApiProperty({ description: 'Credential configuration' })
  @Column({ type: 'jsonb', default: {} })
  configuration: Record<string, any>;

  @ApiProperty({ description: 'Whether credential is active' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Last used timestamp' })
  @Column({ type: 'timestamp with time zone', nullable: true })
  lastUsedAt?: Date;

  @ApiProperty({ description: 'Expiration date for tokens' })
  @Column({ type: 'timestamp with time zone', nullable: true })
  expiresAt?: Date;

  // Relations
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  // Organization relationship
  @ManyToOne(() => Organization, (org) => org.credentials)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  organizationId: string;

  // Credential sharing settings
  @Column({ type: 'json', nullable: true })
  sharing?: {
    isShared: boolean;
    sharedWith: string[]; // user IDs who can use this credential
  };

  get isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }
}
