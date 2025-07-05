import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { WorkflowExecutionProcessor } from './processors/workflow-execution.processor';
import { WorkflowNodeProcessor } from './processors/workflow-node.processor';
import { WORKFLOW_EXECUTION_QUEUE, WORKFLOW_NODE_QUEUE } from './constants';
import { WorkflowExecution } from '../../domain/entities/workflow-execution.entity';
import { Workflow } from '../../domain/entities/workflow.entity';
import { WorkflowNode } from '../../domain/entities/workflow-node.entity';
import { WorkflowNodeConnection } from '../../domain/entities/workflow-node-connection.entity';
import { WorkflowExecutionLog } from '../../domain/entities/workflow-execution-log.entity';
import { WorkflowExecutionService } from '../../application/services/workflow-execution.service';
import { NodeExecutorFactory } from '../../application/node-executors/node-executor.factory';
import {
  TriggerNodeExecutor,
  HttpRequestNodeExecutor,
  ActionNodeExecutor,
  ConditionNodeExecutor,
  WebhookNodeExecutor,
  EmailNodeExecutor,
  DelayNodeExecutor,
} from '../../application/node-executors/executors';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkflowExecution,
      Workflow,
      WorkflowNode,
      WorkflowNodeConnection,
      WorkflowExecutionLog,
    ]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          password: configService.get('redis.password'),
          db: configService.get('redis.db'),
        },
        prefix: configService.get('redis.bull.prefix'),
        defaultJobOptions: configService.get('redis.bull.defaultJobOptions'),
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: WORKFLOW_EXECUTION_QUEUE,
      },
      {
        name: WORKFLOW_NODE_QUEUE,
      },
    ),
    HttpModule,
  ],
  providers: [
    WorkflowExecutionProcessor,
    WorkflowNodeProcessor,
    WorkflowExecutionService,
    NodeExecutorFactory,
    TriggerNodeExecutor,
    HttpRequestNodeExecutor,
    ActionNodeExecutor,
    ConditionNodeExecutor,
    WebhookNodeExecutor,
    EmailNodeExecutor,
    DelayNodeExecutor,
  ],
  exports: [BullModule],
})
export class WorkflowQueueModule { }
