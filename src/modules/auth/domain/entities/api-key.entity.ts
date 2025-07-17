import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
} from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import * as crypto from 'crypto';

@Entity('api_keys')
@Index(['key'], { unique: true })
@Index(['userId'])
export class ApiKey extends BaseEntity {
  @ApiProperty({ description: 'API key name' })
  @Column()
  name: string;

  @ApiProperty({ description: 'API key (hashed)' })
  @Column({ unique: true })
  key: string;

  @ApiProperty({ description: 'Key prefix for identification' })
  @Column()
  prefix: string;

  @ApiProperty({ description: 'Last 4 characters of key' })
  @Column()
  lastFour: string;

  @ApiProperty({ description: 'Permissions/scopes' })
  @Column({ type: 'jsonb', default: [] })
  scopes: string[];

  @ApiProperty({ description: 'IP whitelist' })
  @Column({ type: 'jsonb', nullable: true })
  ipWhitelist?: string[];

  @ApiProperty({ description: 'Expiration date' })
  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @ApiProperty({ description: 'Last used timestamp' })
  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt?: Date;

  @ApiProperty({ description: 'Usage count' })
  @Column({ default: 0 })
  usageCount: number;

  @ApiProperty({ description: 'Rate limit per hour' })
  @Column({ default: 1000 })
  rateLimit: number;

  @ApiProperty({ description: 'Is active' })
  @Column({ default: true })
  isActive: boolean;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ nullable: true })
  organizationId?: string;

  // Methods
  static generateKey(): {
    key: string;
    hashedKey: string;
    prefix: string;
    lastFour: string;
  } {
    const key = `wc_${crypto.randomBytes(32).toString('hex')}`;
    const hashedKey = crypto.createHash('sha256').update(key).digest('hex');
    const prefix = key.substring(0, 7);
    const lastFour = key.substring(key.length - 4);

    return { key, hashedKey, prefix, lastFour };
  }

  static hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }
}
