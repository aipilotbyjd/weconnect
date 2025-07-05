import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Workflow } from './workflow.entity';

export enum VariableType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
  SECRET = 'secret',
}

export enum VariableScope {
  WORKFLOW = 'workflow',
  GLOBAL = 'global',
  ORGANIZATION = 'organization',
}

@Entity('workflow_variables')
@Index(['workflowId', 'name'], { unique: true })
@Index(['organizationId', 'name', 'scope'])
export class WorkflowVariable extends BaseEntity {
  @ApiProperty({ description: 'Variable name' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Variable value' })
  @Column({ type: 'text', nullable: true })
  value: string;

  @ApiProperty({ description: 'Variable type', enum: VariableType })
  @Column({
    type: 'enum',
    enum: VariableType,
    default: VariableType.STRING,
  })
  type: VariableType;

  @ApiProperty({ description: 'Variable scope', enum: VariableScope })
  @Column({
    type: 'enum',
    enum: VariableScope,
    default: VariableScope.WORKFLOW,
  })
  scope: VariableScope;

  @ApiProperty({ description: 'Variable description' })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({ description: 'Is secret/encrypted' })
  @Column({ default: false })
  isSecret: boolean;

  @ApiProperty({ description: 'Is system variable' })
  @Column({ default: false })
  isSystem: boolean;

  // Relations
  @ManyToOne(() => Workflow, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflowId' })
  workflow?: Workflow;

  @Column({ nullable: true })
  workflowId?: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  organizationId?: string;
}
