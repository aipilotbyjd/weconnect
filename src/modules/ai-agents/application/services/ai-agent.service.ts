import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIAgent } from '../../domain/entities/ai-agent.entity';
import { AIAgentTool } from '../../domain/entities/ai-agent-tool.entity';
import { AIProviderService, AIProvider } from './ai-provider.service';
import { AIToolService, ToolConfig } from './ai-tool.service';
import { AIMemoryService, MemoryConfig } from './ai-memory.service';
import { MemoryType } from '../../domain/entities/ai-agent-memory.entity';

export interface CreateAIAgentDto {
  name: string;
  description: string;
  provider: AIProvider;
  model: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: string[];
  memoryType?: MemoryType;
  memoryConfig?: MemoryConfig;
}

export interface UpdateAIAgentDto {
  name?: string;
  description?: string;
  provider?: AIProvider;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: string[];
  memoryType?: MemoryType;
  memoryConfig?: MemoryConfig;
}

@Injectable()
export class AIAgentService {
  private readonly logger = new Logger(AIAgentService.name);

  constructor(
    @InjectRepository(AIAgent)
    private readonly agentRepository: Repository<AIAgent>,
    @InjectRepository(AIAgentTool)
    private readonly agentToolRepository: Repository<AIAgentTool>,
    private readonly providerService: AIProviderService,
    private readonly toolService: AIToolService,
    private readonly memoryService: AIMemoryService,
  ) {}

  /**
   * Create a new AI agent
   */
  async createAgent(createDto: CreateAIAgentDto): Promise<AIAgent> {
    try {
      // Validate provider configuration
      this.providerService.validateProviderConfig({
        provider: createDto.provider,
        model: createDto.model,
        temperature: createDto.temperature,
        maxTokens: createDto.maxTokens,
      });

      // Create agent configuration
      const configuration = {
        provider: createDto.provider,
        model: createDto.model,
        systemPrompt:
          createDto.systemPrompt || 'You are a helpful AI assistant.',
        temperature: createDto.temperature || 0.7,
        maxTokens: createDto.maxTokens || 1000,
        memoryType: createDto.memoryType || MemoryType.CONVERSATION,
        memoryConfig: createDto.memoryConfig || {
          type: MemoryType.CONVERSATION,
        },
      };

      // Create the agent
      const agent = this.agentRepository.create({
        name: createDto.name,
        description: createDto.description,
        provider: createDto.provider,
        model: createDto.model,
        configuration,
      });

      const savedAgent = await this.agentRepository.save(agent);

      // Add tools if specified
      if (createDto.tools && createDto.tools.length > 0) {
        await this.addToolsToAgent(savedAgent.id, createDto.tools);
      }

      this.logger.log(
        `Created AI agent: ${savedAgent.name} (${savedAgent.id})`,
      );
      return savedAgent;
    } catch (error) {
      this.logger.error('Failed to create AI agent:', error);
      throw new BadRequestException(
        `Failed to create AI agent: ${error.message}`,
      );
    }
  }

  /**
   * Update an existing AI agent
   */
  async updateAgent(id: string, updateDto: UpdateAIAgentDto): Promise<AIAgent> {
    const agent = await this.findAgentById(id);

    // Validate provider configuration if provider or model is being updated
    if (updateDto.provider || updateDto.model) {
      this.providerService.validateProviderConfig({
        provider: updateDto.provider || (agent.provider as AIProvider),
        model: updateDto.model || agent.model,
        temperature: updateDto.temperature,
        maxTokens: updateDto.maxTokens,
      });
    }

    // Update configuration
    const updatedConfiguration = {
      ...agent.configuration,
      ...(updateDto.provider && { provider: updateDto.provider }),
      ...(updateDto.model && { model: updateDto.model }),
      ...(updateDto.systemPrompt && { systemPrompt: updateDto.systemPrompt }),
      ...(updateDto.temperature !== undefined && {
        temperature: updateDto.temperature,
      }),
      ...(updateDto.maxTokens !== undefined && {
        maxTokens: updateDto.maxTokens,
      }),
      ...(updateDto.memoryType && { memoryType: updateDto.memoryType }),
      ...(updateDto.memoryConfig && { memoryConfig: updateDto.memoryConfig }),
    };

    // Update agent fields
    Object.assign(agent, {
      ...(updateDto.name && { name: updateDto.name }),
      ...(updateDto.description && { description: updateDto.description }),
      ...(updateDto.provider && { provider: updateDto.provider }),
      ...(updateDto.model && { model: updateDto.model }),
      configuration: updatedConfiguration,
    });

    const savedAgent = await this.agentRepository.save(agent);

    // Update tools if specified
    if (updateDto.tools) {
      await this.updateAgentTools(id, updateDto.tools);
    }

    this.logger.log(`Updated AI agent: ${savedAgent.name} (${savedAgent.id})`);
    return savedAgent;
  }

  /**
   * Find agent by ID
   */
  async findAgentById(id: string): Promise<AIAgent> {
    const agent = await this.agentRepository.findOne({
      where: { id },
    });

    if (!agent) {
      throw new NotFoundException(`AI agent with ID ${id} not found`);
    }

    return agent;
  }

  /**
   * Get all agents
   */
  async getAllAgents(): Promise<AIAgent[]> {
    return this.agentRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Delete an agent
   */
  async deleteAgent(id: string): Promise<void> {
    const agent = await this.findAgentById(id);

    // Clear all memory for this agent
    await this.memoryService.clearMemory(id, '*');

    await this.agentRepository.remove(agent);
    this.logger.log(`Deleted AI agent: ${agent.name} (${id})`);
  }

  /**
   * Add tools to an agent
   */
  async addToolsToAgent(agentId: string, toolNames: string[]): Promise<void> {
    const agent = await this.findAgentById(agentId);
    const availableTools = this.toolService.getAvailableTools();

    for (const toolName of toolNames) {
      const toolConfig = availableTools.find((t) => t.name === toolName);
      if (!toolConfig) {
        this.logger.warn(`Tool ${toolName} not found, skipping`);
        continue;
      }

      const agentTool = this.agentToolRepository.create({
        agentId: agent.id,
        name: toolConfig.name,
        description: toolConfig.description,
        configuration: toolConfig.parameters || {},
      });

      await this.agentToolRepository.save(agentTool);
    }

    this.logger.debug(`Added ${toolNames.length} tools to agent ${agentId}`);
  }

  /**
   * Update agent tools
   */
  async updateAgentTools(agentId: string, toolNames: string[]): Promise<void> {
    const agent = await this.findAgentById(agentId);

    // Remove existing tools
    await this.agentToolRepository.delete({ agentId: agent.id });

    // Add new tools
    if (toolNames.length > 0) {
      await this.addToolsToAgent(agentId, toolNames);
    }

    this.logger.debug(`Updated tools for agent ${agentId}`);
  }

  /**
   * Get agent tools
   */
  async getAgentTools(agentId: string): Promise<AIAgentTool[]> {
    return this.agentToolRepository.find({
      where: { agentId },
    });
  }

  /**
   * Get agent with tools
   */
  async getAgentWithTools(
    id: string,
  ): Promise<AIAgent & { tools: AIAgentTool[] }> {
    const agent = await this.findAgentById(id);
    const tools = await this.getAgentTools(id);

    return { ...agent, tools };
  }

  /**
   * Test agent configuration
   */
  async testAgent(
    id: string,
    testPrompt: string = 'Hello, how are you?',
  ): Promise<any> {
    try {
      const agent = await this.findAgentById(id);

      // Create language model
      const llm = this.providerService.createLanguageModel({
        provider: agent.provider as AIProvider,
        model: agent.model,
        temperature: agent.configuration.temperature,
        maxTokens: agent.configuration.maxTokens,
      });

      // Test the model with a simple prompt
      const response = await llm.invoke(testPrompt);

      return {
        success: true,
        response: response.content,
        metadata: {
          provider: agent.provider,
          model: agent.model,
          promptTokens: testPrompt.length,
          responseTokens: response.content.length,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to test agent ${id}:`, error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get agent statistics
   */
  async getAgentStats(): Promise<any> {
    try {
      const totalAgents = await this.agentRepository.count();

      const providerStats = await this.agentRepository
        .createQueryBuilder('agent')
        .select('agent.provider', 'provider')
        .addSelect('COUNT(*)', 'count')
        .groupBy('agent.provider')
        .getRawMany();

      const modelStats = await this.agentRepository
        .createQueryBuilder('agent')
        .select('agent.model', 'model')
        .addSelect('COUNT(*)', 'count')
        .groupBy('agent.model')
        .getRawMany();

      return {
        totalAgents,
        byProvider: providerStats,
        byModel: modelStats,
      };
    } catch (error) {
      this.logger.error('Failed to get agent stats:', error);
      return null;
    }
  }

  /**
   * Search agents
   */
  async searchAgents(query: string): Promise<AIAgent[]> {
    return this.agentRepository
      .createQueryBuilder('agent')
      .where('agent.name ILIKE :query OR agent.description ILIKE :query', {
        query: `%${query}%`,
      })
      .orderBy('agent.createdAt', 'DESC')
      .getMany();
  }
}
