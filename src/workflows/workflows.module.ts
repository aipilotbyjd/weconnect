import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkflowsService } from './workflows.service';
import { WorkflowsController } from './workflows.controller';
import { Workflow } from '../core/infrastructure/database/entities/workflow.entity';
import { WorkflowNode } from '../core/infrastructure/database/entities/workflow-node.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Workflow, WorkflowNode])],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
