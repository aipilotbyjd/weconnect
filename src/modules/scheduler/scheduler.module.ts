import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { SchedulerService } from './application/services/scheduler.service';
import { ScheduledWorkflowService } from './application/services/scheduled-workflow.service';
import { ScheduledWorkflow } from './domain/entities/scheduled-workflow.entity';
import { ScheduledWorkflowController } from './presentation/controllers/scheduled-workflow.controller';
import { Workflow } from '../workflows/domain/entities/workflow.entity';
import { WorkflowExecution } from '../workflows/domain/entities/workflow-execution.entity';
import { WORKFLOW_EXECUTION_QUEUE } from '../workflows/infrastructure/queues/constants';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([ScheduledWorkflow, Workflow, WorkflowExecution]),
    BullModule.registerQueue({
      name: WORKFLOW_EXECUTION_QUEUE,
    }),
  ],
  controllers: [ScheduledWorkflowController],
  providers: [SchedulerService, ScheduledWorkflowService],
  exports: [ScheduledWorkflowService],
})
export class SchedulerModule {}
