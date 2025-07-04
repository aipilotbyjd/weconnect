// Export all executors
export * from './trigger-node.executor';
export * from './http-request-node.executor';

// Placeholder executors - to be implemented
import { Injectable } from '@nestjs/common';
import { WorkflowNode } from '../../../domain/entities/workflow-node.entity';
import { NodeExecutor } from '../node-executor.interface';

@Injectable()
export class ActionNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, inputData: Record<string, any>, executionId: string): Promise<Record<string, any>> {
    return { ...inputData, action: node.name };
  }
  async validate(configuration: Record<string, any>): Promise<boolean> {
    return true;
  }
}

@Injectable()
export class ConditionNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, inputData: Record<string, any>, executionId: string): Promise<Record<string, any>> {
    return { ...inputData, condition: true };
  }
  async validate(configuration: Record<string, any>): Promise<boolean> {
    return true;
  }
}

@Injectable()
export class WebhookNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, inputData: Record<string, any>, executionId: string): Promise<Record<string, any>> {
    return { ...inputData, webhook: node.configuration };
  }
  async validate(configuration: Record<string, any>): Promise<boolean> {
    return true;
  }
}

@Injectable()
export class EmailNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, inputData: Record<string, any>, executionId: string): Promise<Record<string, any>> {
    return { ...inputData, email: 'sent' };
  }
  async validate(configuration: Record<string, any>): Promise<boolean> {
    return true;
  }
}

@Injectable()
export class DelayNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, inputData: Record<string, any>, executionId: string): Promise<Record<string, any>> {
    const delay = node.configuration.delay || 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    return { ...inputData, delayed: delay };
  }
  async validate(configuration: Record<string, any>): Promise<boolean> {
    return true;
  }
}
