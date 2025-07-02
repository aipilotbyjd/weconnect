export interface NodeExecutionContext {
  nodeId: string;
  workflowId: string;
  executionId: string;
  inputData: any[];
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
  workflow: any;
}

export interface NodeExecutionResult {
  success: boolean;
  data?: any[];
  error?: string;
  metadata?: {
    executionTime?: number;
    itemsProcessed?: number;
    [key: string]: any;
  };
}

export interface INodeExecutor {
  execute(context: NodeExecutionContext): Promise<NodeExecutionResult>;
}
