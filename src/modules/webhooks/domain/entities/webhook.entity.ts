import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';import { ApiProperty } from '@nestjs/swagger';
import { Workflow } from '../../../workflows/domain/entities/workflow.entity';
import { User } from '../../../auth/domain/entities/user.entity';

export enum WebhookMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

@Schema({ collection: 'webhooks' })
export class Webhook extends BaseSchema {
  @ApiProperty({
    description: 'Webhook name',
    example: 'User Registration Webhook',
  })
  @Prop()
  name: string;

  @ApiProperty({
    description: 'Unique webhook path',
    example: 'user-registration-abc123',
  })
  @Prop({ unique: true })
  path: string;

  @ApiProperty({ description: 'HTTP method', enum: WebhookMethod })
  @Prop({
    type: 'enum',
    enum: WebhookMethod,
    default: WebhookMethod.POST,
  })
  method: WebhookMethod;

  @ApiProperty({ description: 'Whether webhook is active' })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Expected headers for validation' })
  @Prop({ type: 'jsonb', default: {} })
  expectedHeaders: Record<string, string>;

  @ApiProperty({ description: 'Webhook secret for validation' })
  @Prop({ nullable: true })
  secret?: string;

  @ApiProperty({ description: 'Request count' })
  @Prop({ default: 0 })
  requestCount: number;

  @ApiProperty({ description: 'Last triggered timestamp' })
  @Prop({ type: 'timestamp with time zone', nullable: true })
  lastTriggeredAt?: Date;

  // Relations
  @ManyToOne(() => Workflow, { eager: true })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Prop()
  workflowId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Prop()
  userId: string;

  get fullUrl(): string {
    return `/webhooks/${this.path}`;
  }
}


export const WebhookSchema = SchemaFactory.createForClass(Webhook);