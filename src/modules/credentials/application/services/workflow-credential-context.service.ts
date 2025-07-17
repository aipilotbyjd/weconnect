import { Injectable } from '@nestjs/common';

export interface WorkflowExecutionContext {
  userId: string;
  organizationId?: string;
  workflowId: string;
  executionId: string;
  nodeId: string;
  timestamp: string;
}

@Injectable()
export class WorkflowCredentialContextService {
  /**
   * Inject user context into workflow execution data
   * This ensures node executors have access to user credentials
   */
  injectContext(
    inputData: Record<string, any>,
    context: WorkflowExecutionContext,
  ): Record<string, any> {
    return {
      ...inputData,
      _context: context,
      // For backward compatibility
      userId: context.userId,
      executionId: context.executionId,
      workflowId: context.workflowId,
    };
  }

  /**
   * Extract context from execution data
   */
  extractContext(data: Record<string, any>): WorkflowExecutionContext | null {
    if (data._context) {
      return data._context as WorkflowExecutionContext;
    }

    // Fallback for backward compatibility
    if (data.userId && data.executionId && data.workflowId) {
      return {
        userId: data.userId,
        executionId: data.executionId,
        workflowId: data.workflowId,
        nodeId: data.nodeId || 'unknown',
        timestamp: new Date().toISOString(),
      };
    }

    return null;
  }

  /**
   * Create execution context
   */
  createContext(
    userId: string,
    workflowId: string,
    executionId: string,
    nodeId: string,
    organizationId?: string,
  ): WorkflowExecutionContext {
    return {
      userId,
      organizationId,
      workflowId,
      executionId,
      nodeId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate that context contains required credential information
   */
  validateCredentialContext(data: Record<string, any>): {
    isValid: boolean;
    userId?: string;
    error?: string;
  } {
    const context = this.extractContext(data);

    if (!context) {
      return {
        isValid: false,
        error: 'No execution context found',
      };
    }

    if (!context.userId) {
      return {
        isValid: false,
        error: 'User ID not found in execution context',
      };
    }

    return {
      isValid: true,
      userId: context.userId,
    };
  }
}
