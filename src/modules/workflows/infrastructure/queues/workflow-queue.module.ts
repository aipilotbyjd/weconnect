import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WorkflowExecutionProcessor } from './processors/workflow-execution.processor';
import { WorkflowNodeProcessor } from './processors/workflow-node.processor';
import { WORKFLOW_EXECUTION_QUEUE, WORKFLOW_NODE_QUEUE } from './constants';

@Module({
  imports: [
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
  ],
  providers: [WorkflowExecutionProcessor, WorkflowNodeProcessor],
  exports: [BullModule],
})
export class WorkflowQueueModule { }
