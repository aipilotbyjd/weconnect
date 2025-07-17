import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
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
