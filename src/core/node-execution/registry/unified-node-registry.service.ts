import { Injectable, Logger } from '@nestjs/common';
import { IUnifiedNodeExecutor, NodeSchema } from '../interfaces/unified-node-executor.interface';
import { NodeType } from '../../../modules/workflows/domain/entities/workflow-node.entity';

@Injectable()
export class UnifiedNodeRegistryService {
  private readonly logger = new Logger(UnifiedNodeRegistryService.name);
  private readonly executors = new Map<string, IUnifiedNodeExecutor>();
  private readonly schemas = new Map<string, NodeSchema>();

  /**
   * Register a node executor
   */
  registerExecutor(nodeType: string, executor: IUnifiedNodeExecutor): void {
    this.executors.set(nodeType, executor);
    this.schemas.set(nodeType, executor.getSchema());
    this.logger.log(`Registered node executor: ${nodeType}`);
  }

  /**
   * Get executor by node type
   */
  getExecutor(nodeType: string): IUnifiedNodeExecutor | undefined {
    return this.executors.get(nodeType);
  }

  /**
   * Get all registered executors
   */
  getAllExecutors(): Map<string, IUnifiedNodeExecutor> {
    return new Map(this.executors);
  }

  /**
   * Get node schema by type
   */
  getSchema(nodeType: string): NodeSchema | undefined {
    return this.schemas.get(nodeType);
  }

  /**
   * Get all schemas grouped by category
   */
  getAllSchemas(): Record<string, NodeSchema[]> {
    const grouped: Record<string, NodeSchema[]> = {};
    
    for (const [nodeType, schema] of this.schemas) {
      for (const group of schema.group) {
        if (!grouped[group]) {
          grouped[group] = [];
        }
        grouped[group].push(schema);
      }
    }
    
    return grouped;
  }

  /**
   * Check if node type is supported
   */
  isSupported(nodeType: string): boolean {
    return this.executors.has(nodeType);
  }

  /**
   * Get available node types
   */
  getAvailableNodeTypes(): string[] {
    return Array.from(this.executors.keys());
  }

  /**
   * Search nodes by name or description
   */
  searchNodes(query: string): NodeSchema[] {
    const results: NodeSchema[] = [];
    const lowerQuery = query.toLowerCase();
    
    for (const schema of this.schemas.values()) {
      if (
        schema.name.toLowerCase().includes(lowerQuery) ||
        schema.displayName.toLowerCase().includes(lowerQuery) ||
        schema.description.toLowerCase().includes(lowerQuery)
      ) {
        results.push(schema);
      }
    }
    
    return results;
  }

  /**
   * Validate all registered executors
   */
  validateRegistry(): { valid: string[]; invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];
    
    for (const [nodeType, executor] of this.executors) {
      try {
        const schema = executor.getSchema();
        if (schema && schema.name && schema.properties) {
          valid.push(nodeType);
        } else {
          invalid.push(nodeType);
        }
      } catch (error) {
        this.logger.error(`Invalid executor for ${nodeType}: ${error.message}`);
        invalid.push(nodeType);
      }
    }
    
    return { valid, invalid };
  }
}