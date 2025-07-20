import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { Workflow } from '../../../workflows/domain/entities/workflow.entity';

export enum ScheduleStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  DELETED = 'deleted',
}

@Schema({ collection: 'scheduled_workflows' })
export class ScheduledWorkflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Prop()
  workflowId: string;

  @ManyToOne(() => Workflow, { onDelete: 'CASCADE' })
  workflow: Workflow;

  @Prop()
  name: string;

  @Prop({ nullable: true })
  description: string;

  @Prop()
  cronExpression: string;

  @Prop({ nullable: true })
  timezone: string;

  @Prop({
    type: 'enum',
    enum: ScheduleStatus,
    default: ScheduleStatus.ACTIVE,
  })
  status: ScheduleStatus;

  @Prop({ type: 'jsonb', nullable: true })
  inputData: Record<string, any>;

  @Prop({ nullable: true })
  lastExecutionId: string;

  @Prop({ type: 'timestamp', nullable: true })
  lastExecutionAt: Date;

  @Prop({ type: 'timestamp', nullable: true })
  nextExecutionAt: Date;

  @Prop({ default: 0 })
  executionCount: number;

  @Prop({ default: 0 })
  failureCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Prop()
  userId: string;

  @Prop({ nullable: true })
  organizationId: string;
}


export const ScheduledWorkflowSchema = SchemaFactory.createForClass(ScheduledWorkflow);