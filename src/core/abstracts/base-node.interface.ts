export interface NodeExecutionContext {
  nodeId: string;
  executionId: string;
  inputData: any;
  configuration: Record<string, any>;
  previousNodeOutputs: Record<string, any>;
}

export interface NodeExecutionResult {
  success: boolean;
  outputData: any;
  errorMessage?: string;
  logs?: string[];
  metadata?: Record<string, any>;
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
