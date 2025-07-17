import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { WorkflowTemplateService } from '../../application/services';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  SearchTemplatesDto,
} from '../../application/dto';
import { WorkflowTemplate } from '../../domain/entities';

@ApiTags('Workflow Templates')
@Controller('api/v1/workflow-templates')
export class WorkflowTemplateController {
  constructor(private readonly templateService: WorkflowTemplateService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new workflow template' })
  async create(
    @Body() dto: CreateTemplateDto,
    @Request() req,
  ): Promise<WorkflowTemplate> {
    return await this.templateService.create(dto, req.user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a workflow template' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
    @Request() req,
  ): Promise<WorkflowTemplate> {
    return await this.templateService.update(id, dto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a workflow template' })
  async delete(@Param('id') id: string, @Request() req): Promise<void> {
    await this.templateService.delete(id, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a workflow template by ID' })
  async findOne(@Param('id') id: string): Promise<WorkflowTemplate> {
    return await this.templateService.findOne(id);
  }

  @Get()
  @ApiOperation({ summary: 'Search workflow templates' })
  async search(@Query() query: SearchTemplatesDto, @Request() req) {
    const user = req.user || null;
    return await this.templateService.search(query, user);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a workflow template' })
  async publish(
    @Param('id') id: string,
    @Request() req,
  ): Promise<WorkflowTemplate> {
    return await this.templateService.publish(id, req.user);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a workflow template (admin only)' })
  async approve(
    @Param('id') id: string,
    @Request() req,
  ): Promise<WorkflowTemplate> {
    return await this.templateService.approve(id, req.user);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject a workflow template (admin only)' })
  async reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ): Promise<WorkflowTemplate> {
    return await this.templateService.reject(id, reason, req.user);
  }

  @Post(':id/import')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Import a workflow template' })
  async import(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
    @Request() req,
  ): Promise<WorkflowTemplate> {
    return await this.templateService.importTemplate(
      id,
      req.user,
      organizationId,
    );
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download a workflow template' })
  async download(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
    @Request() req,
  ): Promise<WorkflowTemplate> {
    return await this.templateService.downloadTemplate(
      id,
      req.user,
      organizationId,
    );
  }
}
