import { Injectable, Logger } from '@nestjs/common';
import { WorkflowNode } from '../../../domain/entities/workflow-node.entity';
import { NodeExecutor } from '../node-executor.interface';

@Injectable()
export class TriggerNodeExecutor implements NodeExecutor {
  private readonly logger = new Logger(TriggerNodeExecutor.name);

  async execute(
    node: WorkflowNode,
    inputData: Record<string, any>,
    executionId: string,
  ): Promise<Record<string, any>> {
    this.logger.log(`Executing trigger node: ${node.name}`);
    
    // Pass through input data for trigger nodes
    return {
      ...inputData,
      trigger: {
        nodeId: node.id,
        nodeName: node.name,
        executionId,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async validate(configuration: Record<string, any>): Promise<boolean> {
    return true;
  }
}
