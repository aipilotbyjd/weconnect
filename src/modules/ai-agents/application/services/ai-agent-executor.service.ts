import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIAgent } from '../../domain/entities/ai-agent.entity';
import { AIAgentExecution, ExecutionStatus } from '../../domain/entities/ai-agent-execution.entity';
import { AIProviderService, AIProvider } from './ai-provider.service';
import { AIToolService } from './ai-tool.service';
import { AIMemoryService } from './ai-memory.service';
import { AIAgentService } from './ai-agent.service';
import { AgentExecutor, createReactAgent } from 'langchain/agents';
import { BasePromptTemplate } from '@langchain/core/prompts';
import { PromptTemplate } from '@langchain/core/prompts';
import { BaseMemory } from '@langchain/core/memory';

export interface AIAgentExecutionContext {
  agentId: string;
  workflowExecutionId: string;
  nodeId: string;
  sessionId: string;
  inputData: any;
  previousNodeOutputs?: Record<string, any>;
  parameters?: Record<string, any>;
}

export interface AIAgentExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    executionTime?: number;
    toolsUsed?: string[];
    [key: string]: any;
  };
}

@Injectable()
export class AIAgentExecutorService {
  private readonly logger = new Logger(AIAgentExecutorService.name);

  constructor(
    @InjectRepository(AIAgentExecution)
    private readonly executionRepository: Repository<AIAgentExecution>,
    private readonly agentService: AIAgentService,
    private readonly providerService: AIProviderService,
    private readonly toolService: AIToolService,
    private readonly memoryService: AIMemoryService,
  ) {}

  /**
   * Execute an AI agent within a workflow context
   */
  async executeAgent(context: AIAgentExecutionContext): Promise<AIAgentExecutionResult> {
    const startTime = Date.now();
    let execution: AIAgentExecution | null = null;

    try {
      // Create execution record
      execution = await this.createExecutionRecord(context);

      // Get agent configuration
      const agent = await this.agentService.getAgentWithTools(context.agentId);
      
      // Create language model
      const llm = this.providerService.createLanguageModel({
        provider: agent.provider as AIProvider,
        model: agent.model,
        temperature: agent.configuration.temperature,
        maxTokens: agent.configuration.maxTokens,
      });

      // Create tools
      const toolConfigs = agent.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.configuration,
      }));

      const tools = this.toolService.createTools(toolConfigs, {
        workflowExecutionId: context.workflowExecutionId,
        previousNodeOutputs: context.previousNodeOutputs,
      });

      // Create memory if configured
      let memory: BaseMemory | undefined = undefined;
      if (agent.configuration.memoryType && agent.configuration.memoryConfig) {
        memory = await this.memoryService.createMemory(
          context.agentId,
          context.sessionId,
          agent.configuration.memoryConfig,
          llm
        );
      }

      // Build prompt
      const prompt = await this.buildPrompt(agent.configuration.systemPrompt, context);

      // For now, let's create a simple execution without complex agent framework
      // In a full implementation, you'd use the proper LangChain agent setup
      
      // Execute the LLM directly with the prompt
      const result = await llm.invoke(prompt);
      
      // Simulate agent result structure
      const agentResult = {
        output: result.content,
        intermediateSteps: [],
      };

      // Calculate execution time
      const executionTime = Date.now() - startTime;

      // Extract metadata
      const metadata = {
        executionTime,
        toolsUsed: this.extractToolsUsed(agentResult.intermediateSteps),
        tokensUsed: this.estimateTokensUsed(prompt, agentResult.output as string),
        intermediateSteps: agentResult.intermediateSteps?.length || 0,
      };

      // Update execution record
      await this.updateExecutionRecord(execution.id, {
        status: ExecutionStatus.COMPLETED,
        outputData: agentResult.output,
        metadata,
        executionTime,
        completedAt: new Date(),
      });

      // Save memory if configured
      if (memory && agent.configuration.memoryType) {
        // For now, we'll save a simplified memory structure
        // In a full implementation, you'd extract the actual memory content
        await this.memoryService.saveMemoryData(
          context.agentId,
          context.sessionId,
          agent.configuration.memoryType,
          [{ role: 'user', content: prompt }, { role: 'assistant', content: agentResult.output }]
        );
      }

      this.logger.debug(`AI agent execution completed for agent ${context.agentId}`);

      return {
        success: true,
        data: agentResult.output,
        metadata,
      };

    } catch (error) {
      this.logger.error(`AI agent execution failed for agent ${context.agentId}:`, error);

      const executionTime = Date.now() - startTime;

      // Update execution record with error
      if (execution) {
        await this.updateExecutionRecord(execution.id, {
          status: ExecutionStatus.FAILED,
          error: error.message,
          executionTime,
          completedAt: new Date(),
        });
      }

      return {
        success: false,
        error: error.message,
        metadata: {
          executionTime,
        },
      };
    }
  }

  /**
   * Create execution record
   */
  private async createExecutionRecord(context: AIAgentExecutionContext): Promise<AIAgentExecution> {
    const execution = this.executionRepository.create({
      agentId: context.agentId,
      workflowExecutionId: context.workflowExecutionId,
      nodeId: context.nodeId,
      inputData: context.inputData,
      status: ExecutionStatus.RUNNING,
      startedAt: new Date(),
    });

    return this.executionRepository.save(execution);
  }

  /**
   * Update execution record
   */
  private async updateExecutionRecord(executionId: string, updates: Partial<AIAgentExecution>): Promise<void> {
    await this.executionRepository.update(executionId, updates);
  }

  /**
   * Build prompt from system prompt and context
   */
  private async buildPrompt(systemPrompt: string, context: AIAgentExecutionContext): Promise<string> {
    const template = new PromptTemplate({
      template: `${systemPrompt}

Current context:
- Workflow Execution ID: {workflowExecutionId}
- Node ID: {nodeId}
- Session ID: {sessionId}

Input data: {inputData}

Previous node outputs: {previousNodeOutputs}

Parameters: {parameters}

Please process this information and provide a helpful response.`,
      inputVariables: ['workflowExecutionId', 'nodeId', 'sessionId', 'inputData', 'previousNodeOutputs', 'parameters'],
    });

    return await template.format({
      workflowExecutionId: context.workflowExecutionId,
      nodeId: context.nodeId,
      sessionId: context.sessionId,
      inputData: JSON.stringify(context.inputData, null, 2),
      previousNodeOutputs: JSON.stringify(context.previousNodeOutputs || {}, null, 2),
      parameters: JSON.stringify(context.parameters || {}, null, 2),
    });
  }

  /**
   * Extract tools used from intermediate steps
   */
  private extractToolsUsed(intermediateSteps: any[]): string[] {
    if (!intermediateSteps || !Array.isArray(intermediateSteps)) {
      return [];
    }

    const toolsUsed = new Set<string>();
    
    for (const step of intermediateSteps) {
      if (step.action && step.action.tool) {
        toolsUsed.add(step.action.tool);
      }
    }

    return Array.from(toolsUsed);
  }

  /**
   * Estimate tokens used (rough estimation)
   */
  private estimateTokensUsed(input: string, output: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil((input.length + output.length) / 4);
  }

  /**
   * Get execution history for an agent
   */
  async getExecutionHistory(agentId: string, limit: number = 50): Promise<AIAgentExecution[]> {
    return this.executionRepository.find({
      where: { agentId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  /**
   * Get execution by ID
   */
  async getExecution(executionId: string): Promise<AIAgentExecution | null> {
    return this.executionRepository.findOne({
      where: { id: executionId },
      relations: ['agent'],
    });
  }

  /**
   * Get execution statistics
   */
  async getExecutionStats(agentId?: string): Promise<any> {
    try {
      const query = this.executionRepository.createQueryBuilder('execution');

      if (agentId) {
        query.where('execution.agentId = :agentId', { agentId });
      }

      const totalExecutions = await query.getCount();

      const statusStats = await query
        .select('execution.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('execution.status')
        .getRawMany();

      const avgExecutionTime = await query
        .select('AVG(execution.executionTime)', 'avgTime')
        .where('execution.executionTime IS NOT NULL')
        .getRawOne();

      const totalTokensUsed = await query
        .select('SUM(execution.tokensUsed)', 'totalTokens')
        .where('execution.tokensUsed IS NOT NULL')
        .getRawOne();

      return {
        totalExecutions,
        statusDistribution: statusStats,
        averageExecutionTime: avgExecutionTime?.avgTime || 0,
        totalTokensUsed: totalTokensUsed?.totalTokens || 0,
      };
    } catch (error) {
      this.logger.error('Failed to get execution stats:', error);
      return null;
    }
  }

  /**
   * Cancel a running execution
   */
  async cancelExecution(executionId: string): Promise<void> {
    await this.executionRepository.update(executionId, {
      status: ExecutionStatus.CANCELLED,
      completedAt: new Date(),
    });
  }

  /**
   * Clean up old executions
   */
  async cleanupOldExecutions(olderThanDays: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await this.executionRepository
        .createQueryBuilder()
        .delete()
        .where('createdAt < :cutoffDate', { cutoffDate })
        .execute();

      this.logger.debug(`Cleaned up ${result.affected} old execution records`);
    } catch (error) {
      this.logger.error('Failed to cleanup old executions:', error);
    }
  }
}
