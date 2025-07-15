import { Injectable, Logger } from '@nestjs/common';
import { UnifiedNodeRegistryService } from '../registry/unified-node-registry.service';
import { 
  NodeExecutionContext, 
  NodeExecutionResult, 
  IUnifiedNodeExecutor 
} from '../interfaces/unified-node-executor.interface';
import { WorkflowNode } from '../../../modules/workflows/domain/entities/workflow-node.entity';

@Injectable()
export class UnifiedNodeExecutionService {
  private readonly logger = new Logger(UnifiedNodeExecutionService.name);

  constructor(
    private readonly nodeRegistry: UnifiedNodeRegistryService,
  ) {}

  /**
   * Execute a single node
   */
  async executeNode(
    node: WorkflowNode,
    context: Partial<NodeExecutionContext>
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Get the executor for this node type
      const executor = this.nodeRegistry.getExecutor(node.type);
      if (!executor) {
        return this.createErrorResult(
          `No executor found for node type: ${node.type}`,
          node.id
        );
      }

      // Build full execution context
      const fullContext: NodeExecutionContext = {
        nodeId: node.id,
        workflowId: node.workflowId,
        executionId: context.executionId || '',
        organizationId: context.organizationId || '',
        userId: context.userId || '',
        node,
        inputData: context.inputData || [],
        parameters: { ...node.configuration, ...context.parameters },
        credentials: context.credentials,
        previousNodeOutputs: context.previousNodeOutputs || {},
        workflowVariables: context.workflowVariables || {},
        metadata: context.metadata,
        retryCount: context.retryCount || 0,
        isRetry: context.isRetry || false,
      };

      // Validate node configuration before execution
      const validation = executor.validate(fullContext.parameters);
      if (!validation.isValid) {
        return this.createErrorResult(
          `Node validation failed: ${validation.errors.join(', ')}`,
          node.id
        );
      }

      this.logger.log(`Executing node: ${node.name} (${node.type})`);

      // Execute the node
      const result = await executor.execute(fullContext);

      // Add execution metadata
      result.metadata = {
        ...result.metadata,
        nodeId: node.id,
        nodeName: node.name,
        nodeType: node.type,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };

      this.logger.log(
        `Node execution completed: ${node.name} (${result.success ? 'SUCCESS' : 'FAILED'})`
      );

      return result;
    } catch (error) {
      this.logger.error(`Node execution error: ${error.message}`, error.stack);
      
      return this.createErrorResult(
        `Execution failed: ${error.message}`,
        node.id,
        Date.now() - startTime
      );
    }
  }

  /**
   * Execute multiple nodes in sequence
   */
  async executeNodesSequence(
    nodes: WorkflowNode[],
    context: Partial<NodeExecutionContext>
  ): Promise<NodeExecutionResult[]> {
    const results: NodeExecutionResult[] = [];
    let currentData = context.inputData || [];
    
    for (const node of nodes) {
      const nodeContext = {
        ...context,
        inputData: currentData,
      };
      
      const result = await this.executeNode(node, nodeContext);
      results.push(result);
      
      // If execution failed and shouldn't continue, break
      if (!result.success && !result.shouldContinue) {
        break;
      }
      
      // Use output as input for next node
      if (result.success && result.data) {
        currentData = result.data;
      }
    }
    
    return results;
  }

  /**
   * Test node configuration without full execution
   */
  async testNode(
    node: WorkflowNode,
    context: Partial<NodeExecutionContext>
  ): Promise<{ valid: boolean; errors: string[]; warnings?: string[] }> {
    try {
      const executor = this.nodeRegistry.getExecutor(node.type);
      if (!executor) {
        return {
          valid: false,
          errors: [`No executor found for node type: ${node.type}`],
        };
      }

      const validation = executor.validate(node.configuration);
      
      // Test connection if supported
      if (executor.testConnection && context.credentials) {
        try {
          const connectionValid = await executor.testConnection(context.credentials);
          if (!connectionValid) {
            validation.errors.push('Connection test failed');
            validation.isValid = false;
          }
        } catch (error) {
          validation.errors.push(`Connection test error: ${error.message}`);
          validation.isValid = false;
        }
      }

      return {
        valid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Test failed: ${error.message}`],
      };
    }
  }

  /**
   * Get available options for a node property
   */
  async getNodeOptions(
    nodeType: string,
    optionName: string,
    credentials: Record<string, any>,
    parameters: Record<string, any>
  ): Promise<{ name: string; value: any }[]> {
    try {
      const executor = this.nodeRegistry.getExecutor(nodeType);
      if (!executor || !executor.getOptions) {
        return [];
      }

      return await executor.getOptions(optionName, credentials, parameters);
    } catch (error) {
      this.logger.error(`Failed to get options for ${nodeType}.${optionName}: ${error.message}`);
      return [];
    }
  }

  private createErrorResult(
    errorMessage: string,
    nodeId: string,
    executionTime?: number
  ): NodeExecutionResult {
    return {
      success: false,
      errorMessage,
      shouldContinue: false,
      metadata: {
        nodeId,
        executionTime: executionTime || 0,
        timestamp: new Date().toISOString(),
      },
    };
  }
}