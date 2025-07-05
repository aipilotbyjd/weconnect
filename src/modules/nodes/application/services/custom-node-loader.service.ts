import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';
import { NodeDefinition } from '../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../domain/interfaces/node-executor.interface';
import { NodeRegistryService } from '../registry/node-registry.service';

export interface CustomNodePackage {
  name: string;
  version: string;
  description: string;
  nodes: Array<{
    definition: NodeDefinition;
    executor: string; // JavaScript code as string
  }>;
}

@Injectable()
export class CustomNodeLoaderService {
  private readonly logger = new Logger(CustomNodeLoaderService.name);
  private customNodesPath = path.join(process.cwd(), 'custom-nodes');
  private loadedNodes = new Map<string, INodeExecutor>();

  constructor(
    @InjectRepository(NodeDefinition)
    private nodeDefinitionRepository: Repository<NodeDefinition>,
    private nodeRegistry: NodeRegistryService,
  ) {
    this.ensureCustomNodesDirectory();
  }

  private ensureCustomNodesDirectory(): void {
    if (!fs.existsSync(this.customNodesPath)) {
      fs.mkdirSync(this.customNodesPath, { recursive: true });
    }
  }

  async loadCustomNode(nodePackage: CustomNodePackage): Promise<void> {
    this.logger.log(`Loading custom node package: ${nodePackage.name}`);

    for (const node of nodePackage.nodes) {
      try {
        // Create executor from string
        const executor = this.createExecutorFromCode(node.executor);
        
        // Save node definition to database
        const savedDefinition = await this.nodeDefinitionRepository.save({
          ...node.definition,
          isCustom: true,
          packageName: nodePackage.name,
          packageVersion: nodePackage.version,
        });

        // Register with node registry
        this.nodeRegistry.registerNode(savedDefinition, executor);
        this.loadedNodes.set(node.definition.name, executor);

        this.logger.log(`Loaded custom node: ${node.definition.name}`);
      } catch (error) {
        this.logger.error(`Failed to load custom node ${node.definition.name}:`, error);
        throw error;
      }
    }
  }

  private createExecutorFromCode(code: string): INodeExecutor {
    // Create a sandboxed context for executing the custom node code
    const sandbox = {
      console: console,
      require: (module: string) => {
        // Whitelist allowed modules
        const allowedModules = ['axios', 'lodash', 'moment'];
        if (allowedModules.includes(module)) {
          return require(module);
        }
        throw new Error(`Module ${module} is not allowed in custom nodes`);
      },
      exports: {},
    };

    // Execute the code in sandbox
    const script = new vm.Script(code);
    const context = vm.createContext(sandbox);
    script.runInContext(context);

    // Get the exported executor class
    const ExecutorClass = sandbox.exports.default || sandbox.exports.NodeExecutor;
    if (!ExecutorClass) {
      throw new Error('Custom node must export a default executor class');
    }

    return new ExecutorClass();
  }

  async loadFromFile(filePath: string): Promise<void> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const nodePackage: CustomNodePackage = JSON.parse(content);
    await this.loadCustomNode(nodePackage);
  }

  async loadAllFromDirectory(): Promise<void> {
    const files = fs.readdirSync(this.customNodesPath)
      .filter(file => file.endsWith('.json'));

    for (const file of files) {
      try {
        await this.loadFromFile(path.join(this.customNodesPath, file));
      } catch (error) {
        this.logger.error(`Failed to load custom node from ${file}:`, error);
      }
    }
  }

  async unloadCustomNode(nodeName: string): Promise<void> {
    const executor = this.loadedNodes.get(nodeName);
    if (!executor) {
      throw new Error(`Custom node ${nodeName} is not loaded`);
    }

    // Remove from registry
    this.nodeRegistry.unregisterNode(nodeName);
    this.loadedNodes.delete(nodeName);

    // Mark as inactive in database
    await this.nodeDefinitionRepository.update(
      { name: nodeName, isCustom: true },
      { isActive: false },
    );

    this.logger.log(`Unloaded custom node: ${nodeName}`);
  }

  async validateCustomNode(nodePackage: CustomNodePackage): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Validate package structure
    if (!nodePackage.name) {
      errors.push('Package name is required');
    }
    if (!nodePackage.version) {
      errors.push('Package version is required');
    }
    if (!nodePackage.nodes || !Array.isArray(nodePackage.nodes)) {
      errors.push('Package must contain nodes array');
    }

    // Validate each node
    for (const [index, node] of nodePackage.nodes.entries()) {
      if (!node.definition) {
        errors.push(`Node at index ${index} missing definition`);
      }
      if (!node.executor) {
        errors.push(`Node at index ${index} missing executor code`);
      }

      // Try to create executor to validate code
      try {
        this.createExecutorFromCode(node.executor);
      } catch (error) {
        errors.push(`Node at index ${index} has invalid executor code: ${error.message}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  generateNodeTemplate(): CustomNodePackage {
    return {
      name: 'my-custom-node-package',
      version: '1.0.0',
      description: 'Custom node package template',
      nodes: [{
        definition: {
          name: 'MyCustomNode',
          displayName: 'My Custom Node',
          description: 'A custom node that does something',
          version: 1,
          group: ['custom'],
          icon: 'fa:cog',
          defaults: {
            name: 'My Custom Node',
            color: '#772244',
          },
          inputs: ['main'],
          outputs: ['main'],
          properties: [
            {
              name: 'operation',
              displayName: 'Operation',
              type: 'options',
              options: [
                { name: 'Do Something', value: 'doSomething' },
                { name: 'Do Something Else', value: 'doSomethingElse' },
              ],
              default: 'doSomething',
              required: true,
            },
          ],
        } as any,
        executor: `
class NodeExecutor {
  async execute(context) {
    const { operation } = context.parameters;
    const inputData = context.inputData;
    
    let outputData = [];
    
    for (const item of inputData) {
      if (operation === 'doSomething') {
        outputData.push({
          ...item,
          processed: true,
          timestamp: new Date().toISOString(),
        });
      } else {
        outputData.push({
          ...item,
          processedDifferently: true,
        });
      }
    }
    
    return {
      success: true,
      data: outputData,
      metadata: {
        itemsProcessed: outputData.length,
      },
    };
  }
}

exports.default = NodeExecutor;
`,
      }],
    };
  }
}
