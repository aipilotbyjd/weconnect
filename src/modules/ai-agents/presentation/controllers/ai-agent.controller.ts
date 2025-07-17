import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import {
  AIAgentService,
  CreateAIAgentDto,
  UpdateAIAgentDto,
} from '../../application/services/ai-agent.service';
import { AIProviderService } from '../../application/services/ai-provider.service';
import { AIToolService } from '../../application/services/ai-tool.service';
import { AIAgentExecutorService } from '../../application/services/ai-agent-executor.service';
import { CreateAIAgentRequestDto } from '../dto/create-ai-agent.dto';
import { UpdateAIAgentRequestDto } from '../dto/update-ai-agent.dto';
import { TestAgentRequestDto } from '../dto/test-agent.dto';

@ApiTags('AI Agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai-agents')
export class AIAgentController {
  constructor(
    private readonly agentService: AIAgentService,
    private readonly providerService: AIProviderService,
    private readonly toolService: AIToolService,
    private readonly executorService: AIAgentExecutorService,
  ) {}

  @Get('providers')
  @ApiOperation({ summary: 'Get available AI providers' })
  @ApiResponse({ status: 200, description: 'List of available AI providers' })
  async getProviders() {
    return {
      success: true,
      data: this.providerService.getAllProviders(),
    };
  }

  @Get('tools')
  @ApiOperation({ summary: 'Get available AI tools' })
  @ApiResponse({ status: 200, description: 'List of available AI tools' })
  async getTools() {
    return {
      success: true,
      data: this.toolService.getAvailableTools(),
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new AI agent' })
  @ApiResponse({ status: 201, description: 'AI agent created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @HttpCode(HttpStatus.CREATED)
  async createAgent(@Body() createDto: CreateAIAgentRequestDto) {
    try {
      const agent = await this.agentService.createAgent(createDto);
      return {
        success: true,
        data: agent,
        message: 'AI agent created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all AI agents' })
  @ApiResponse({ status: 200, description: 'List of AI agents' })
  async getAllAgents(@Query('search') search?: string) {
    try {
      let agents;

      if (search) {
        agents = await this.agentService.searchAgents(search);
      } else {
        agents = await this.agentService.getAllAgents();
      }

      return {
        success: true,
        data: agents,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get AI agent by ID' })
  @ApiResponse({ status: 200, description: 'AI agent details' })
  @ApiResponse({ status: 404, description: 'AI agent not found' })
  async getAgent(@Param('id') id: string) {
    try {
      const agent = await this.agentService.getAgentWithTools(id);
      return {
        success: true,
        data: agent,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update AI agent' })
  @ApiResponse({ status: 200, description: 'AI agent updated successfully' })
  @ApiResponse({ status: 404, description: 'AI agent not found' })
  async updateAgent(
    @Param('id') id: string,
    @Body() updateDto: UpdateAIAgentRequestDto,
  ) {
    try {
      const agent = await this.agentService.updateAgent(id, updateDto);
      return {
        success: true,
        data: agent,
        message: 'AI agent updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete AI agent' })
  @ApiResponse({ status: 200, description: 'AI agent deleted successfully' })
  @ApiResponse({ status: 404, description: 'AI agent not found' })
  async deleteAgent(@Param('id') id: string) {
    try {
      await this.agentService.deleteAgent(id);
      return {
        success: true,
        message: 'AI agent deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test AI agent' })
  @ApiResponse({ status: 200, description: 'Test results' })
  @ApiResponse({ status: 404, description: 'AI agent not found' })
  async testAgent(
    @Param('id') id: string,
    @Body() testDto: TestAgentRequestDto,
  ) {
    try {
      const result = await this.agentService.testAgent(id, testDto.prompt);
      return {
        success: result.success,
        data: result.success ? result : undefined,
        error: result.success ? undefined : result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get(':id/executions')
  @ApiOperation({ summary: 'Get agent execution history' })
  @ApiResponse({ status: 200, description: 'Execution history' })
  async getExecutionHistory(
    @Param('id') id: string,
    @Query('limit') limit: number = 50,
  ) {
    try {
      const executions = await this.executorService.getExecutionHistory(
        id,
        limit,
      );
      return {
        success: true,
        data: executions,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get agent statistics' })
  @ApiResponse({ status: 200, description: 'Agent statistics' })
  async getAgentStats(@Param('id') id: string) {
    try {
      const stats = await this.executorService.getExecutionStats(id);
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get overall agent statistics' })
  @ApiResponse({ status: 200, description: 'Overall statistics' })
  async getOverallStats() {
    try {
      const [agentStats, executionStats] = await Promise.all([
        this.agentService.getAgentStats(),
        this.executorService.getExecutionStats(),
      ]);

      return {
        success: true,
        data: {
          agents: agentStats,
          executions: executionStats,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post(':id/tools')
  @ApiOperation({ summary: 'Update agent tools' })
  @ApiResponse({ status: 200, description: 'Tools updated successfully' })
  async updateAgentTools(
    @Param('id') id: string,
    @Body() body: { tools: string[] },
  ) {
    try {
      await this.agentService.updateAgentTools(id, body.tools);
      return {
        success: true,
        message: 'Agent tools updated successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Delete('executions/:executionId')
  @ApiOperation({ summary: 'Cancel agent execution' })
  @ApiResponse({ status: 200, description: 'Execution cancelled' })
  async cancelExecution(@Param('executionId') executionId: string) {
    try {
      await this.executorService.cancelExecution(executionId);
      return {
        success: true,
        message: 'Execution cancelled successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
