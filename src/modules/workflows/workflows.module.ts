import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CredentialsModule } from '../credentials/credentials.module';

// Presentation Layer
import { WorkflowsController } from './presentation/controllers/workflows.controller';
import { WorkflowExecutionsController } from './presentation/controllers/workflow-executions.controller';

// Application Layer
import { WorkflowsService } from './application/services/workflows.service';
import { WorkflowExecutionService } from './application/services/workflow-execution.service';
import { WorkflowVariablesService } from './application/services/workflow-variables.service';
import { WorkflowVersioningService } from './application/services/workflow-versioning.service';
import { WorkflowImportExportService } from './application/services/workflow-import-export.service';
import { NodeExecutorFactory } from './application/node-executors/node-executor.factory';
import {
  TriggerNodeExecutor,
  HttpRequestNodeExecutor,
  ActionNodeExecutor,
  ConditionNodeExecutor,
  WebhookNodeExecutor,
  EmailNodeExecutor,
  DelayNodeExecutor,
} from './application/node-executors/executors';

// Domain Layer
import { Workflow } from './domain/entities/workflow.entity';
import { WorkflowNode } from './domain/entities/workflow-node.entity';
import { WorkflowNodeConnection } from './domain/entities/workflow-node-connection.entity';
import { WorkflowExecution } from './domain/entities/workflow-execution.entity';
import { WorkflowExecutionLog } from './domain/entities/workflow-execution-log.entity';
import { WorkflowVariable } from './domain/entities/workflow-variable.entity';
import { WorkflowVersion } from './domain/entities/workflow-version.entity';

// Infrastructure Layer
import { WorkflowQueueModule } from './infrastructure/queues/workflow-queue.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workflow,
      WorkflowNode,
      WorkflowNodeConnection,
      WorkflowExecution,
      WorkflowExecutionLog,
      WorkflowVariable,
      WorkflowVersion,
    ]),
    WorkflowQueueModule,
    HttpModule,
    CredentialsModule,
  ],
  controllers: [WorkflowsController, WorkflowExecutionsController],
  providers: [
    WorkflowsService,
    WorkflowExecutionService,
    WorkflowVariablesService,
    WorkflowVersioningService,
    WorkflowImportExportService,
    NodeExecutorFactory,
    TriggerNodeExecutor,
    HttpRequestNodeExecutor,
    ActionNodeExecutor,
    ConditionNodeExecutor,
    WebhookNodeExecutor,
    EmailNodeExecutor,
    DelayNodeExecutor,
  ],
  exports: [WorkflowsService, WorkflowExecutionService],
})
export class WorkflowsModule { }
