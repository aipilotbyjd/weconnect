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
// Import enhanced execution services
import { CircuitBreakerService } from '../executions/application/services/circuit-breaker.service';
import { PerformanceMonitorService } from '../executions/application/services/performance-monitor.service';
import { ExecutionWebSocketModule } from '../executions/infrastructure/websocket/execution-websocket.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([ScheduledWorkflow, Workflow, WorkflowExecution]),
    BullModule.registerQueue({
      name: WORKFLOW_EXECUTION_QUEUE,
    }),
    ExecutionWebSocketModule,
  ],
  controllers: [ScheduledWorkflowController],
  providers: [
    SchedulerService, 
    ScheduledWorkflowService,
    CircuitBreakerService,
    PerformanceMonitorService,
  ],
  exports: [
    ScheduledWorkflowService,
    CircuitBreakerService,
    PerformanceMonitorService,
  ],
})
export class SchedulerModule {}
