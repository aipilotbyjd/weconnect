import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionsService } from '../../application/services/executions.service';
import { StartExecutionDto } from '../dto/start-execution.dto';
import { Execution } from '../../domain/entities/execution.entity';
import { ExecutionLog } from '../../domain/entities/execution-log.entity';

@ApiTags('executions')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('executions')
export class ExecutionsController {
  constructor(private readonly executionsService: ExecutionsService) {}

  @Post('workflows/:workflowId/start')
  @ApiOperation({ summary: 'Start workflow execution' })
  @ApiResponse({
    status: 201,
    description: 'Execution started successfully',
    type: Execution,
  })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  @ApiResponse({ status: 400, description: 'Workflow is not active' })
  startExecution(
    @Param('workflowId') workflowId: string,
    @Body() startExecutionDto: StartExecutionDto,
    @Req() req: any,
  ): Promise<Execution> {
    return this.executionsService.startExecution(
      workflowId,
      startExecutionDto,
      req.user.id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all executions for current user' })
  @ApiResponse({
    status: 200,
    description: 'Executions retrieved successfully',
    type: [Execution],
  })
  findAll(@Req() req: any): Promise<Execution[]> {
    return this.executionsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get execution by ID' })
  @ApiResponse({
    status: 200,
    description: 'Execution retrieved successfully',
    type: Execution,
  })
  @ApiResponse({ status: 404, description: 'Execution not found' })
  findOne(@Param('id') id: string): Promise<Execution> {
    return this.executionsService.findOne(id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get execution logs' })
  @ApiResponse({
    status: 200,
    description: 'Execution logs retrieved successfully',
    type: [ExecutionLog],
  })
  @ApiResponse({ status: 404, description: 'Execution not found' })
  getExecutionLogs(@Param('id') id: string): Promise<ExecutionLog[]> {
    return this.executionsService.getExecutionLogs(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel running execution' })
  @ApiResponse({
    status: 200,
    description: 'Execution cancelled successfully',
    type: Execution,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot cancel completed execution',
  })
  cancelExecution(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<Execution> {
    return this.executionsService.cancelExecution(id, req.user.id);
  }
}
  @Get(':id/metrics')
  @ApiOperation({ summary: 'Get detailed execution metrics' })
  @ApiResponse({
    status: 200,
    description: 'Execution metrics retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Execution not found' })
  getExecutionMetrics(@Param('id') id: string) {
    return this.executionsService.getExecutionMetrics(id);
  }

  @Get('system/health')
  @ApiOperation({ summary: 'Get system health and performance metrics' })
  @ApiResponse({
    status: 200,
    description: 'System health retrieved successfully',
  })
  getSystemHealth() {
    return this.executionsService.getSystemHealth();
  }

  @Patch(':id/pause')
  @ApiOperation({ summary: 'Pause running execution' })
  @ApiResponse({
    status: 200,
    description: 'Execution paused successfully',
    type: Execution,
  })
  @ApiResponse({
    status: 400,
    description: 'Can only pause running executions',
  })
  pauseExecution(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<Execution> {
    return this.executionsService.pauseExecution(id, req.user.id);
  }

  @Patch(':id/resume')
  @ApiOperation({ summary: 'Resume paused execution' })
  @ApiResponse({
    status: 200,
    description: 'Execution resumed successfully',
    type: Execution,
  })
  @ApiResponse({
    status: 400,
    description: 'Can only resume paused executions',
  })
  resumeExecution(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<Execution> {
    return this.executionsService.resumeExecution(id, req.user.id);
  }

  @Get('workflows/:workflowId')
  @ApiOperation({ summary: 'Get executions for a specific workflow' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by execution status' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of results' })
  @ApiResponse({
    status: 200,
    description: 'Workflow executions retrieved successfully',
    type: [Execution],
  })
  getWorkflowExecutions(
    @Param('workflowId') workflowId: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Req() req: any,
  ) {
    // This would need to be implemented in the service
    // return this.executionsService.findWorkflowExecutions(workflowId, req.user.id, { status, limit });
    return this.executionsService.findAll(req.user.id);
  }
}