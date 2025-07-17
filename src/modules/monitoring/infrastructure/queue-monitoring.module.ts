import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import {
  WORKFLOW_EXECUTION_QUEUE,
  WORKFLOW_NODE_QUEUE,
} from '../../workflows/infrastructure/queues/constants';

@Module({
  imports: [
    // Bull Board configuration for integrated monitoring
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),

    // Register queue monitoring for workflow execution queue
    BullBoardModule.forFeature({
      name: WORKFLOW_EXECUTION_QUEUE,
      adapter: BullAdapter,
    }),

    // Register queue monitoring for workflow node queue
    BullBoardModule.forFeature({
      name: WORKFLOW_NODE_QUEUE,
      adapter: BullAdapter,
    }),
  ],
  providers: [],
  exports: [],
})
export class QueueMonitoringModule {}
