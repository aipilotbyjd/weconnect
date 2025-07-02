import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Presentation Layer
import { WorkflowsController } from './presentation/controllers/workflows.controller';

// Application Layer
import { WorkflowsService } from './application/services/workflows.service';
import { CreateWorkflowUseCase } from './application/use-cases/create-workflow.use-case';
import { GetWorkflowsUseCase } from './application/use-cases/get-workflows.use-case';

// Domain Layer
import { Workflow } from './domain/entities/workflow.entity';
import { WorkflowNode } from './domain/entities/workflow-node.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Workflow, WorkflowNode])],
  controllers: [WorkflowsController],
  providers: [
    WorkflowsService,
    CreateWorkflowUseCase,
    GetWorkflowsUseCase,
  ],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
