import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../auth/domain/entities/user.entity';
import { WorkflowNode } from './workflow-node.entity';
import { WorkflowExecution } from './workflow-execution.entity';
import { Organization } from '../../../organizations/domain/entities/organization.entity';

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

@Entity('workflows')
export class Workflow extends BaseEntity {
  @ApiProperty({ description: 'Workflow name', example: 'Email Marketing Campaign' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Workflow description' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Workflow status', enum: WorkflowStatus })
  @Column({
    type: 'enum',
    enum: WorkflowStatus,
    default: WorkflowStatus.DRAFT,
  })
  status: WorkflowStatus;

  @ApiProperty({ description: 'Workflow configuration JSON' })
  @Column({ type: 'jsonb', default: {} })
  configuration: Record<string, any>;

  @ApiProperty({ description: 'Whether workflow is active' })
  @Column({ default: false })
  isActive: boolean;

  @ApiProperty({ description: 'Workflow execution count' })
  @Column({ default: 0 })
  executionCount: number;

  @ApiProperty({ description: 'Last execution timestamp' })
  @Column({ type: 'timestamp with time zone', nullable: true })
  lastExecutedAt?: Date;

  // Relations
  @ApiProperty({ description: 'Workflow owner' })
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  // Organization relationship
  @ManyToOne(() => Organization, (org) => org.workflows)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  organizationId: string;

  @OneToMany(() => WorkflowNode, node => node.workflow, { cascade: true })
  nodes: WorkflowNode[];

  @OneToMany(() => WorkflowExecution, execution => execution.workflow)
  executions: WorkflowExecution[];

  // Workflow sharing settings
  @Column({ type: 'json', nullable: true })
  sharing?: {
    isPublic: boolean;
    sharedWith: string[]; // user IDs
  };

  @Column({ type: 'json', nullable: true })
  tags?: string[];
}
