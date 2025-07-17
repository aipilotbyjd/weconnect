import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Presentation Layer
import { ExecutionsController } from './presentation/controllers/executions.controller';

// Application Layer
import { ExecutionsService } from './application/services/executions.service';
import { WorkflowExecutionService } from './application/services/workflow-execution.service';
import { StartExecutionUseCase } from './application/use-cases/start-execution.use-case';

// Domain Layer
import { Execution } from './domain/entities/execution.entity';
import { ExecutionLog } from './domain/entities/execution-log.entity';

// Import from other modules
import { Workflow } from '../workflows/domain/entities/workflow.entity';
import { WorkflowNode } from '../workflows/domain/entities/workflow-node.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Execution, ExecutionLog, Workflow, WorkflowNode]),
  ],
  controllers: [ExecutionsController],
  providers: [
    ExecutionsService,
    WorkflowExecutionService,
    StartExecutionUseCase,
  ],
  exports: [ExecutionsService],
})
export class ExecutionsModule {}
