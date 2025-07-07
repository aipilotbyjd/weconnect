export interface NodeExecutionContext {
  nodeId: string;
  workflowId: string;
  executionId: string;
  inputData: any[];
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
  previousNodeOutputs: Record<string, any>;
  workflow?: any;
  metadata?: Record<string, any>;
}

export interface NodeExecutionResult {
  success: boolean;
  data?: any[];
  outputData?: any;
  error?: string;
  errorMessage?: string;
  outputs?: Record<string, any[]>;
  logs?: string[];
  metadata?: {
    executionTime?: number;
    itemsProcessed?: number;
    [key: string]: any;
  };
}

export interface INodeExecutor {
  execute(context: NodeExecutionContext): Promise<NodeExecutionResult>;
  validate(configuration: Record<string, any>): boolean;
  getConfigurationSchema(): Record<string, any>;
}

export abstract class BaseNodeExecutor implements INodeExecutor {
  abstract execute(context: NodeExecutionContext): Promise<NodeExecutionResult>;
  
  validate(configuration: Record<string, any>): boolean {
    return true; // Override in specific implementations
  }

  getConfigurationSchema(): Record<string, any> {
    return {}; // Override in specific implementations
  }

  protected createSuccessResult(outputData: any, metadata?: Record<string, any>): NodeExecutionResult {
    return {
      success: true,
      outputData,
      metadata,
    };
  }

  protected createErrorResult(errorMessage: string, outputData?: any): NodeExecutionResult {
    return {
      success: false,
      outputData: outputData || {},
      errorMessage,
    };
  }
}
