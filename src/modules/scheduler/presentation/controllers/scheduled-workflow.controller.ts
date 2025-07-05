import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ScheduledWorkflowService } from '../../application/services/scheduled-workflow.service';
import { CreateScheduledWorkflowDto } from '../dto/create-scheduled-workflow.dto';
import { UpdateScheduledWorkflowDto } from '../dto/update-scheduled-workflow.dto';
import { ScheduledWorkflow } from '../../domain/entities/scheduled-workflow.entity';

@ApiTags('scheduled-workflows')
@Controller('scheduled-workflows')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ScheduledWorkflowController {
  constructor(private readonly scheduledWorkflowService: ScheduledWorkflowService) {}

  @Post('workflows/:workflowId')
  @ApiOperation({ summary: 'Create a scheduled workflow' })
  @ApiResponse({
    status: 201,
    description: 'Scheduled workflow created successfully',
    type: ScheduledWorkflow,
  })
  async create(
    @Param('workflowId') workflowId: string,
    @Body() dto: CreateScheduledWorkflowDto,
    @Req() req: any,
  ): Promise<ScheduledWorkflow> {
    return this.scheduledWorkflowService.create(workflowId, req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all scheduled workflows for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of scheduled workflows',
    type: [ScheduledWorkflow],
  })
  async findAll(@Req() req: any): Promise<ScheduledWorkflow[]> {
    return this.scheduledWorkflowService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a scheduled workflow by ID' })
  @ApiResponse({
    status: 200,
    description: 'Scheduled workflow details',
    type: ScheduledWorkflow,
  })
  async findOne(@Param('id') id: string, @Req() req: any): Promise<ScheduledWorkflow> {
    return this.scheduledWorkflowService.findOne(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a scheduled workflow' })
  @ApiResponse({
    status: 200,
    description: 'Scheduled workflow updated successfully',
    type: ScheduledWorkflow,
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateScheduledWorkflowDto,
    @Req() req: any,
  ): Promise<ScheduledWorkflow> {
    return this.scheduledWorkflowService.update(id, req.user.id, dto);
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause a scheduled workflow' })
  @ApiResponse({
    status: 200,
    description: 'Scheduled workflow paused successfully',
    type: ScheduledWorkflow,
  })
  async pause(@Param('id') id: string, @Req() req: any): Promise<ScheduledWorkflow> {
    return this.scheduledWorkflowService.pause(id, req.user.id);
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume a scheduled workflow' })
  @ApiResponse({
    status: 200,
    description: 'Scheduled workflow resumed successfully',
    type: ScheduledWorkflow,
  })
  async resume(@Param('id') id: string, @Req() req: any): Promise<ScheduledWorkflow> {
    return this.scheduledWorkflowService.resume(id, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a scheduled workflow' })
  @ApiResponse({
    status: 204,
    description: 'Scheduled workflow deleted successfully',
  })
  async delete(@Param('id') id: string, @Req() req: any): Promise<void> {
    return this.scheduledWorkflowService.delete(id, req.user.id);
  }

  @Get(':id/next-executions')
  @ApiOperation({ summary: 'Get next execution times for a scheduled workflow' })
  @ApiResponse({
    status: 200,
    description: 'List of next execution times',
    type: [Date],
  })
  async getNextExecutions(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<Date[]> {
    return this.scheduledWorkflowService.getNextExecutions(id, req.user.id);
  }
}
