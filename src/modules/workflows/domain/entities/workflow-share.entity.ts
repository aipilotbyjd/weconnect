import { Entity, Column, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Workflow } from './workflow.entity';
import { User } from '../../../auth/domain/entities/user.entity';
import { Organization } from '../../../organizations/domain/entities/organization.entity';

export enum SharePermission {
  VIEW = 'view',
  EXECUTE = 'execute',
  EDIT = 'edit',
  ADMIN = 'admin',
}

export enum ShareType {
  USER = 'user',
  ORGANIZATION = 'organization',
  PUBLIC_LINK = 'public_link',
}

@Entity('workflow_shares')
@Index(['workflowId', 'sharedWithId', 'shareType'], { unique: true })
export class WorkflowShare extends BaseEntity {
  @ApiProperty({ description: 'Share type', enum: ShareType })
  @Column({
    type: 'enum',
    enum: ShareType,
  })
  shareType: ShareType;

  @ApiProperty({ description: 'Permission level', enum: SharePermission })
  @Column({
    type: 'enum',
    enum: SharePermission,
    default: SharePermission.VIEW,
  })
  permission: SharePermission;

  @ApiProperty({ description: 'Share expiration date' })
  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @ApiProperty({ description: 'Public share token' })
  @Column({ nullable: true, unique: true })
  shareToken?: string;

  @ApiProperty({ description: 'Share message/note' })
  @Column({ type: 'text', nullable: true })
  message?: string;

  @ApiProperty({ description: 'Number of times accessed' })
  @Column({ default: 0 })
  accessCount: number;

  @ApiProperty({ description: 'Last accessed timestamp' })
  @Column({ type: 'timestamp', nullable: true })
  lastAccessedAt?: Date;

  // Relations
  @ManyToOne(() => Workflow, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Column()
  workflowId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sharedById' })
  sharedBy: User;

  @Column()
  sharedById: string;

  @Column({ nullable: true })
  sharedWithId?: string; // User ID or Organization ID

  @CreateDateColumn()
  sharedAt: Date;
}
