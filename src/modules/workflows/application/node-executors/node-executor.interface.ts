import { WorkflowNode } from '../../domain/entities/workflow-node.entity';

export interface NodeExecutor {
  execute(
    node: WorkflowNode,
    inputData: Record<string, any>,
    executionId: string,
  ): Promise<Record<string, any>>;

  validate(configuration: Record<string, any>): Promise<boolean>;
}
