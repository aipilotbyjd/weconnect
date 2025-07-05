import { Entity, Column, Index, CreateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';
import { ApiProperty } from '@nestjs/swagger';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
  SHARE = 'share',
  EXPORT = 'export',
  IMPORT = 'import',
  LOGIN = 'login',
  LOGOUT = 'logout',
  API_ACCESS = 'api_access',
}

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['entityType', 'entityId'])
@Index(['action', 'createdAt'])
export class AuditLog extends BaseEntity {
  @ApiProperty({ description: 'Action performed', enum: AuditAction })
  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @ApiProperty({ description: 'Entity type affected' })
  @Column()
  entityType: string;

  @ApiProperty({ description: 'Entity ID affected' })
  @Column()
  entityId: string;

  @ApiProperty({ description: 'User who performed the action' })
  @Column()
  userId: string;

  @ApiProperty({ description: 'User email for quick reference' })
  @Column()
  userEmail: string;

  @ApiProperty({ description: 'IP address' })
  @Column({ nullable: true })
  ipAddress?: string;

  @ApiProperty({ description: 'User agent' })
  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @ApiProperty({ description: 'Changes made (for updates)' })
  @Column({ type: 'jsonb', nullable: true })
  changes?: Record<string, any>;

  @ApiProperty({ description: 'Additional metadata' })
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Organization ID' })
  @Column({ nullable: true })
  organizationId?: string;

  @CreateDateColumn()
  performedAt: Date;
}
