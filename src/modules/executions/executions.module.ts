import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Presentation Layer
import { ExecutionsController } from './presentation/controllers/executions.controller';

// Application Layer
import { ExecutionsService } from './application/services/executions.service';
import { WorkflowExecutionService } from './application/services/workflow-execution.service';
import { StartExecutionUseCase } from './application/use-cases/start-execution.use-case';
import { RetryService } from './application/services/retry.service';
import { CircuitBreakerService } from './application/services/circuit-breaker.service';
import { PerformanceMonitorService } from './application/services/performance-monitor.service';

// Infrastructure Layer
import { ExecutionWebSocketModule } from './infrastructure/websocket/execution-websocket.module';
import { ExecutionQueueProcessor } from './infrastructure/queues/execution-queue.processor';

// Domain Layer
import { Execution } from './domain/entities/execution.entity';
import { ExecutionLog } from './domain/entities/execution-log.entity';

// Import from other modules
import { Workflow } from '../workflows/domain/entities/workflow.entity';
import { WorkflowNode } from '../workflows/domain/entities/workflow-node.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Execution, ExecutionLog, Workflow, WorkflowNode]),
    BullModule.registerQueueAsync({
      name: 'execution-queue',
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          password: configService.get('redis.password'),
          db: configService.get('redis.db'),
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      }),
      inject: [ConfigService],
    }),
    ExecutionWebSocketModule,
  ],
  controllers: [ExecutionsController],
  providers: [
    ExecutionsService,
    WorkflowExecutionService,
    StartExecutionUseCase,
    RetryService,
    CircuitBreakerService,
    PerformanceMonitorService,
    ExecutionQueueProcessor,
  ],
  exports: [
    ExecutionsService,
    RetryService,
    CircuitBreakerService,
    PerformanceMonitorService,
  ],
})
export class ExecutionsModule {}
