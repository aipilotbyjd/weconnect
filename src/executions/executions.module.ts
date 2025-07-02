import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExecutionsService } from './executions.service';
import { ExecutionsController } from './executions.controller';
import { Execution } from '../core/infrastructure/database/entities/execution.entity';
import { ExecutionLog } from '../core/infrastructure/database/entities/execution-log.entity';
import { Workflow } from '../core/infrastructure/database/entities/workflow.entity';
import { WorkflowNode } from '../core/infrastructure/database/entities/workflow-node.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Execution, ExecutionLog, Workflow, WorkflowNode])],
  controllers: [ExecutionsController],
  providers: [ExecutionsService],
  exports: [ExecutionsService],
})
export class ExecutionsModule {}
