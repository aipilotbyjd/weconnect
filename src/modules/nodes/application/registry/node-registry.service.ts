import { Injectable, Logger } from '@nestjs/common';
import { NodeDefinition } from '../../domain/entities/node-definition.entity';
import { INodeExecutor } from '../../domain/interfaces/node-executor.interface';

@Injectable()
export class NodeRegistryService {
  private readonly logger = new Logger(NodeRegistryService.name);
  private readonly nodeDefinitions = new Map<string, NodeDefinition>();
  private readonly nodeExecutors = new Map<string, INodeExecutor>();

  registerNode(definition: NodeDefinition, executor: INodeExecutor): void {
    this.nodeDefinitions.set(definition.name, definition);
    this.nodeExecutors.set(definition.name, executor);
    this.logger.log(`Registered node: ${definition.name}`);
  }

  getNodeDefinition(nodeName: string): NodeDefinition | undefined {
    return this.nodeDefinitions.get(nodeName);
  }

  getNodeExecutor(nodeName: string): INodeExecutor | undefined {
    return this.nodeExecutors.get(nodeName);
  }

  getAllNodeDefinitions(): NodeDefinition[] {
    return Array.from(this.nodeDefinitions.values());
  }

  getNodesByGroup(group: string): NodeDefinition[] {
    return Array.from(this.nodeDefinitions.values())
      .filter(node => node.group.includes(group));
  }

  hasNode(nodeName: string): boolean {
    return this.nodeDefinitions.has(nodeName);
  }

  unregisterNode(nodeName: string): void {
    this.nodeDefinitions.delete(nodeName);
    this.nodeExecutors.delete(nodeName);
    this.logger.log(`Unregistered node: ${nodeName}`);
  }

  getRegisteredNodeNames(): string[] {
    return Array.from(this.nodeDefinitions.keys());
  }
}
