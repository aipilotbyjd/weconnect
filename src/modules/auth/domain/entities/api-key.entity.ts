import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import * as crypto from 'crypto';

@Schema({ collection: 'api_keys' })
export class ApiKey extends BaseSchema {
  @ApiProperty({ description: 'API key name' })
  @Prop()
  name: string;

  @ApiProperty({ description: 'API key (hashed)' })
  @Prop({ unique: true })
  key: string;

  @ApiProperty({ description: 'Key prefix for identification' })
  @Prop()
  prefix: string;

  @ApiProperty({ description: 'Last 4 characters of key' })
  @Prop()
  lastFour: string;

  @ApiProperty({ description: 'Permissions/scopes' })
  @Prop({ type: 'jsonb', default: [] })
  scopes: string[];

  @ApiProperty({ description: 'IP whitelist' })
  @Prop({ type: 'jsonb', nullable: true })
  ipWhitelist?: string[];

  @ApiProperty({ description: 'Expiration date' })
  @Prop({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @ApiProperty({ description: 'Last used timestamp' })
  @Prop({ type: 'timestamp', nullable: true })
  lastUsedAt?: Date;

  @ApiProperty({ description: 'Usage count' })
  @Prop({ default: 0 })
  usageCount: number;

  @ApiProperty({ description: 'Rate limit per hour' })
  @Prop({ default: 1000 })
  rateLimit: number;

  @ApiProperty({ description: 'Is active' })
  @Prop({ default: true })
  isActive: boolean;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Prop()
  userId: string;

  @Prop({ nullable: true })
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


export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);