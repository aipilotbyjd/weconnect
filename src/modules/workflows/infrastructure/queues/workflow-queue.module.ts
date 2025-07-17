import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { CredentialsModule } from '../../../credentials/credentials.module';
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
import { GmailNodeExecutor } from '../../application/node-executors/executors/gmail-node.executor';
import { SlackNodeExecutor } from '../../application/node-executors/executors/slack-node.executor';
import { DiscordNodeExecutor } from '../../application/node-executors/executors/discord-node.executor';
import { TelegramNodeExecutor } from '../../application/node-executors/executors/telegram-node.executor';
import { GitHubNodeExecutor } from '../../application/node-executors/executors/github-node.executor';
import { GoogleSheetsNodeExecutor } from '../../application/node-executors/executors/google-sheets-node.executor';
import { TrelloNodeExecutor } from '../../application/node-executors/executors/trello-node.executor';

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
    CredentialsModule,
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
    GmailNodeExecutor,
    SlackNodeExecutor,
    DiscordNodeExecutor,
    TelegramNodeExecutor,
    GitHubNodeExecutor,
    GoogleSheetsNodeExecutor,
    TrelloNodeExecutor,
  ],
  exports: [BullModule],
})
export class WorkflowQueueModule {}
