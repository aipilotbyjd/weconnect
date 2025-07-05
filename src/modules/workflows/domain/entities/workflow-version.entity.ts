import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Workflow } from './workflow.entity';

@Entity('workflow_versions')
@Index(['workflowId', 'version'], { unique: true })
export class WorkflowVersion extends BaseEntity {
  @ApiProperty({ description: 'Version number' })
  @Column()
  declare version: number;

  @ApiProperty({ description: 'Version name/tag' })
  @Column({ nullable: true })
  name?: string;

  @ApiProperty({ description: 'Version description' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Workflow definition at this version' })
  @Column({ type: 'jsonb' })
  definition: Record<string, any>;

  @ApiProperty({ description: 'Workflow configuration at this version' })
  @Column({ type: 'jsonb', nullable: true })
  configuration?: Record<string, any>;

  @ApiProperty({ description: 'Is this the active version' })
  @Column({ default: false })
  isActive: boolean;

  @ApiProperty({ description: 'Is this version published' })
  @Column({ default: false })
  isPublished: boolean;

  @ApiProperty({ description: 'Changelog/commit message' })
  @Column({ type: 'text', nullable: true })
  changelog?: string;

  @ApiProperty({ description: 'User who created this version' })
  @Column()
  createdBy: string;

  @ApiProperty({ description: 'Previous version ID' })
  @Column({ nullable: true })
  previousVersionId?: string;

  // Relations
  @ManyToOne(() => Workflow, workflow => workflow.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Column()
  workflowId: string;
}
