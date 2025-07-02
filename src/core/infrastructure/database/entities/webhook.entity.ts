import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../abstracts/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Workflow } from './workflow.entity';
import { User } from './user.entity';

export enum WebhookMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

@Entity('webhooks')
export class Webhook extends BaseEntity {
  @ApiProperty({ description: 'Webhook name', example: 'User Registration Webhook' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Unique webhook path', example: 'user-registration-abc123' })
  @Column({ unique: true })
  path: string;

  @ApiProperty({ description: 'HTTP method', enum: WebhookMethod })
  @Column({
    type: 'enum',
    enum: WebhookMethod,
    default: WebhookMethod.POST,
  })
  method: WebhookMethod;

  @ApiProperty({ description: 'Whether webhook is active' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Expected headers for validation' })
  @Column({ type: 'jsonb', default: {} })
  expectedHeaders: Record<string, string>;

  @ApiProperty({ description: 'Webhook secret for validation' })
  @Column({ nullable: true })
  secret?: string;

  @ApiProperty({ description: 'Request count' })
  @Column({ default: 0 })
  requestCount: number;

  @ApiProperty({ description: 'Last triggered timestamp' })
  @Column({ type: 'timestamp with time zone', nullable: true })
  lastTriggeredAt?: Date;

  // Relations
  @ManyToOne(() => Workflow, { eager: true })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Column()
  workflowId: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  get fullUrl(): string {
    return `/webhooks/${this.path}`;
  }
}
