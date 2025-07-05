import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WorkflowExecutionService } from '../../application/services/workflow-execution.service';
import { WorkflowExecution } from '../../domain/entities/workflow-execution.entity';
import { ExecuteWorkflowDto } from '../dto/execute-workflow.dto';
import { WorkflowExecutionLog } from '../../domain/entities/workflow-execution-log.entity';

@ApiTags('workflow-executions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('workflows/:workflowId/executions')
export class WorkflowExecutionsController {
  constructor(private readonly executionService: WorkflowExecutionService) { }

  @Post()
  @ApiOperation({ summary: 'Execute a workflow' })
  @ApiResponse({ status: 201, description: 'Workflow execution started', type: WorkflowExecution })
  async execute(
    @Param('workflowId') workflowId: string,
    @Body() executeDto: ExecuteWorkflowDto,
    @Req() req: any,
  ): Promise<WorkflowExecution> {
    return this.executionService.startExecution(
      workflowId,
      req.user.id,
      executeDto.mode,
      executeDto.inputData,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get workflow executions' })
  @ApiResponse({ status: 200, description: 'List of workflow executions', type: [WorkflowExecution] })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Param('workflowId') workflowId: string,
    @Req() req: any,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ): Promise<WorkflowExecution[]> {
    return this.executionService.findWorkflowExecutions(
      workflowId,
      req.user.id,
      { status, limit: limit || 50 }
    );
  }

  @Get(':executionId')
  @ApiOperation({ summary: 'Get execution details' })
  @ApiResponse({ status: 200, description: 'Execution details', type: WorkflowExecution })
  @ApiResponse({ status: 404, description: 'Execution not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findOne(
    @Param('workflowId') workflowId: string,
    @Param('executionId') executionId: string,
    @Req() req: any,
  ): Promise<WorkflowExecution> {
    return this.executionService.findOneWithAuth(
      executionId, 
      workflowId, 
      req.user.id
    );
  }

  @Get(':executionId/logs')
  @ApiOperation({ summary: 'Get execution logs' })
  @ApiResponse({ status: 200, description: 'Execution logs', type: [WorkflowExecutionLog] })
  async getLogs(
    @Param('workflowId') workflowId: string,
    @Param('executionId') executionId: string,
  ): Promise<WorkflowExecutionLog[]> {
    return this.executionService.getExecutionLogs(executionId);
  }

  @Post(':executionId/cancel')
  @ApiOperation({ summary: 'Cancel workflow execution' })
  @ApiResponse({ status: 200, description: 'Execution cancelled' })
  async cancel(
    @Param('workflowId') workflowId: string,
    @Param('executionId') executionId: string,
  ): Promise<void> {
    await this.executionService.cancelExecution(executionId);
  }
}
