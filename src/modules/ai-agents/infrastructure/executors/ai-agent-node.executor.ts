import { Injectable, Logger } from '@nestjs/common';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../nodes/domain/interfaces/node-executor.interface';
import { AIAgentExecutorService, AIAgentExecutionContext } from '../../application/services/ai-agent-executor.service';
import { AIAgentService } from '../../application/services/ai-agent.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AIAgentNodeExecutor implements INodeExecutor {
  private readonly logger = new Logger(AIAgentNodeExecutor.name);

  constructor(
    private readonly agentExecutorService: AIAgentExecutorService,
    private readonly agentService: AIAgentService,
  ) {}

  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const { parameters } = context;
      
      // Extract AI agent configuration from node parameters
      const {
        agentId,
        prompt,
        sessionId = uuidv4(),
        includeWorkflowContext = true,
        customParameters = {},
      } = parameters;

      // Validate required parameters
      if (!agentId) {
        return {
          success: false,
          error: 'Agent ID is required',
          metadata: {
            executionTime: Date.now() - startTime,
          },
        };
      }

      // Verify agent exists
      try {
        await this.agentService.findAgentById(agentId);
      } catch (error) {
        return {
          success: false,
          error: `Agent not found: ${error.message}`,
          metadata: {
            executionTime: Date.now() - startTime,
          },
        };
      }

      // Prepare input data
      let inputData = Array.isArray(context.inputData) ? context.inputData[0] || {} : context.inputData;
      
      // If a custom prompt is provided, use it as input
      if (prompt) {
        inputData = {
          ...inputData,
          prompt,
        };
      }

      // Build execution context for AI agent
      const agentContext: AIAgentExecutionContext = {
        agentId,
        workflowExecutionId: context.executionId,
        nodeId: context.nodeId,
        sessionId,
        inputData,
        previousNodeOutputs: includeWorkflowContext ? this.extractPreviousOutputs(context) : undefined,
        parameters: customParameters,
      };

      // Execute the AI agent
      const result = await this.agentExecutorService.executeAgent(agentContext);

      if (result.success) {
        return {
          success: true,
          data: [result.data],
          metadata: {
            executionTime: Date.now() - startTime,
            agentId,
            sessionId,
            tokensUsed: result.metadata?.tokensUsed,
            toolsUsed: result.metadata?.toolsUsed,
            ...result.metadata,
          },
        };
      } else {
        return {
          success: false,
          error: result.error,
          metadata: {
            executionTime: Date.now() - startTime,
            agentId,
            sessionId,
            ...result.metadata,
          },
        };
      }

    } catch (error) {
      this.logger.error('AI Agent node execution failed:', error);
      
      return {
        success: false,
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Extract previous node outputs from workflow context
   */
  private extractPreviousOutputs(context: NodeExecutionContext): Record<string, any> {
    // This method extracts data from previous nodes in the workflow
    // The exact implementation depends on how your workflow system stores previous node outputs
    
    // For now, we'll try to extract from the workflow object if available
    if (context.workflow && context.workflow.previousOutputs) {
      return context.workflow.previousOutputs;
    }

    // Fallback: create a simple mapping from input data
    return {
      [context.nodeId]: context.inputData,
    };
  }
}
