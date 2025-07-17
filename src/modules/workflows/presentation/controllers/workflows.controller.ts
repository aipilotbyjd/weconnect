import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { WorkflowsService } from '../../application/services/workflows.service';
import { CreateWorkflowDto } from '../dto/create-workflow.dto';
import { UpdateWorkflowDto } from '../dto/update-workflow.dto';
import { Workflow } from '../../domain/entities/workflow.entity';

@ApiTags('workflows')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workflow' })
  @ApiResponse({
    status: 201,
    description: 'Workflow created successfully',
    type: Workflow,
  })
  create(
    @Body() createWorkflowDto: CreateWorkflowDto,
    @Req() req: any,
  ): Promise<Workflow> {
    console.log('User object in controller:', req.user);
    console.log('Current Organization ID:', req.user.currentOrganizationId);
    return this.workflowsService.create(
      createWorkflowDto,
      req.user.id,
      req.user.currentOrganizationId,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all workflows for current user' })
  @ApiResponse({
    status: 200,
    description: 'Workflows retrieved successfully',
    type: [Workflow],
  })
  findAll(@Req() req: any): Promise<Workflow[]> {
    return this.workflowsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workflow by ID' })
  @ApiResponse({
    status: 200,
    description: 'Workflow retrieved successfully',
    type: Workflow,
  })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your workflow' })
  findOne(@Param('id') id: string, @Req() req: any): Promise<Workflow> {
    return this.workflowsService.findOneWithAuth(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update workflow' })
  @ApiResponse({
    status: 200,
    description: 'Workflow updated successfully',
    type: Workflow,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - not your workflow' })
  update(
    @Param('id') id: string,
    @Body() updateWorkflowDto: UpdateWorkflowDto,
    @Req() req: any,
  ): Promise<Workflow> {
    return this.workflowsService.update(id, updateWorkflowDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete workflow' })
  @ApiResponse({ status: 200, description: 'Workflow deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not your workflow' })
  remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    return this.workflowsService.remove(id, req.user.id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate workflow' })
  @ApiResponse({
    status: 200,
    description: 'Workflow activated successfully',
    type: Workflow,
  })
  activate(@Param('id') id: string, @Req() req: any): Promise<Workflow> {
    return this.workflowsService.activate(id, req.user.id);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate workflow' })
  @ApiResponse({
    status: 200,
    description: 'Workflow deactivated successfully',
    type: Workflow,
  })
  deactivate(@Param('id') id: string, @Req() req: any): Promise<Workflow> {
    return this.workflowsService.deactivate(id, req.user.id);
  }

  @Get(':id/validate-connections')
  @ApiOperation({ summary: 'Validate workflow connections' })
  @ApiResponse({
    status: 200,
    description: 'Connection validation results',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        errors: { type: 'array', items: { type: 'string' } },
        warnings: { type: 'array', items: { type: 'string' } },
        executionOrder: { type: 'array', items: { type: 'string' } },
        nodeCount: { type: 'number' },
        connectionCount: { type: 'number' },
      },
    },
  })
  validateConnections(@Param('id') id: string, @Req() req: any): Promise<any> {
    return this.workflowsService.validateConnections(id, req.user.id);
  }
}
