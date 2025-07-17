import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Workflow,
  WorkflowStatus,
} from '../../domain/entities/workflow.entity';
import { WorkflowNode } from '../../domain/entities/workflow-node.entity';
import { WorkflowNodeConnection } from '../../domain/entities/workflow-node-connection.entity';
import { WorkflowVariable } from '../../domain/entities/workflow-variable.entity';
import { v4 as uuidv4 } from 'uuid';

export interface WorkflowExport {
  version: string;
  exportedAt: string;
  workflow: {
    name: string;
    description?: string;
    configuration: Record<string, any>;
    nodes: Array<{
      id: string;
      name: string;
      type: string;
      configuration: Record<string, any>;
      position: Record<string, number>;
      isEnabled: boolean;
    }>;
    connections: Array<{
      sourceNodeId: string;
      targetNodeId: string;
      type: string;
      condition?: Record<string, any>;
    }>;
    variables?: Array<{
      name: string;
      type: string;
      value?: string;
      description?: string;
    }>;
  };
  metadata?: Record<string, any>;
}

@Injectable()
export class WorkflowImportExportService {
  constructor(
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowNode)
    private nodeRepository: Repository<WorkflowNode>,
    @InjectRepository(WorkflowNodeConnection)
    private connectionRepository: Repository<WorkflowNodeConnection>,
    @InjectRepository(WorkflowVariable)
    private variableRepository: Repository<WorkflowVariable>,
  ) {}

  async exportWorkflow(
    workflowId: string,
    userId: string,
    options?: {
      includeVariables?: boolean;
      includeCredentials?: boolean;
      includeExecutionHistory?: boolean;
    },
  ): Promise<WorkflowExport> {
    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId, userId },
      relations: ['nodes', 'nodes.outgoingConnections'],
    });

    if (!workflow) {
      throw new BadRequestException('Workflow not found');
    }

    const exportData: WorkflowExport = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      workflow: {
        name: workflow.name,
        description: workflow.description,
        configuration: workflow.configuration,
        nodes: workflow.nodes.map((node) => ({
          id: node.id,
          name: node.name,
          type: node.type,
          configuration: this.sanitizeNodeConfiguration(
            node.configuration,
            options?.includeCredentials,
          ),
          position: node.position,
          isEnabled: node.isEnabled,
        })),
        connections: [],
      },
    };

    // Export connections
    for (const node of workflow.nodes) {
      for (const conn of node.outgoingConnections) {
        exportData.workflow.connections.push({
          sourceNodeId: node.id,
          targetNodeId: conn.targetNodeId,
          type: conn.type,
          condition: conn.condition,
        });
      }
    }

    // Export variables if requested
    if (options?.includeVariables) {
      const variables = await this.variableRepository.find({
        where: { workflowId },
      });

      exportData.workflow.variables = variables.map((v) => ({
        name: v.name,
        type: v.type,
        value: v.isSecret ? undefined : v.value,
        description: v.description,
      }));
    }

    return exportData;
  }

  async importWorkflow(
    userId: string,
    organizationId: string,
    exportData: WorkflowExport,
    options?: {
      overwriteExisting?: boolean;
      importVariables?: boolean;
      workflowName?: string;
    },
  ): Promise<Workflow> {
    // Validate export format
    if (!exportData.version || !exportData.workflow) {
      throw new BadRequestException('Invalid workflow export format');
    }

    // Check if workflow with same name exists
    const workflowName = options?.workflowName || exportData.workflow.name;
    const existing = await this.workflowRepository.findOne({
      where: { name: workflowName, userId },
    });

    if (existing && !options?.overwriteExisting) {
      throw new BadRequestException('Workflow with this name already exists');
    }

    // Create or update workflow
    const workflow = existing || new Workflow();
    workflow.name = workflowName;
    workflow.description = exportData.workflow.description;
    workflow.configuration = exportData.workflow.configuration;
    workflow.status = WorkflowStatus.DRAFT;
    workflow.userId = userId;
    workflow.organizationId = organizationId;

    const savedWorkflow = await this.workflowRepository.save(workflow);

    // Delete existing nodes if overwriting
    if (existing && options?.overwriteExisting) {
      await this.nodeRepository.delete({ workflowId: savedWorkflow.id });
    }

    // Import nodes with new IDs
    const nodeIdMap = new Map<string, string>();

    for (const nodeData of exportData.workflow.nodes) {
      const newNodeId = uuidv4();
      nodeIdMap.set(nodeData.id, newNodeId);

      await this.nodeRepository.save({
        id: newNodeId,
        workflowId: savedWorkflow.id,
        name: nodeData.name,
        type: nodeData.type as any,
        configuration: nodeData.configuration,
        position: nodeData.position,
        isEnabled: nodeData.isEnabled,
      });
    }

    // Import connections with mapped IDs
    for (const connData of exportData.workflow.connections) {
      const sourceNodeId = nodeIdMap.get(connData.sourceNodeId);
      const targetNodeId = nodeIdMap.get(connData.targetNodeId);

      if (sourceNodeId && targetNodeId) {
        await this.connectionRepository.save({
          sourceNodeId,
          targetNodeId,
          type: connData.type as any,
          condition: connData.condition,
        });
      }
    }

    // Import variables if requested
    if (options?.importVariables && exportData.workflow.variables) {
      for (const varData of exportData.workflow.variables) {
        if (varData.value !== undefined) {
          await this.variableRepository.save({
            workflowId: savedWorkflow.id,
            userId,
            organizationId,
            name: varData.name,
            type: varData.type as any,
            value: varData.value,
            description: varData.description,
            scope: 'workflow' as any,
          });
        }
      }
    }

    return savedWorkflow;
  }

  async validateImport(exportData: any): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check basic structure
    if (!exportData || typeof exportData !== 'object') {
      errors.push('Invalid export data format');
      return { isValid: false, errors, warnings };
    }

    if (!exportData.version) {
      errors.push('Missing version field');
    }

    if (!exportData.workflow) {
      errors.push('Missing workflow field');
      return { isValid: false, errors, warnings };
    }

    const workflow = exportData.workflow;

    // Validate workflow fields
    if (!workflow.name) {
      errors.push('Missing workflow name');
    }

    if (!Array.isArray(workflow.nodes)) {
      errors.push('Invalid nodes format');
    } else {
      // Validate each node
      workflow.nodes.forEach((node: any, index: number) => {
        if (!node.id) {
          errors.push(`Node at index ${index} missing ID`);
        }
        if (!node.type) {
          errors.push(`Node at index ${index} missing type`);
        }
        if (!node.name) {
          warnings.push(`Node at index ${index} missing name`);
        }
      });
    }

    if (!Array.isArray(workflow.connections)) {
      errors.push('Invalid connections format');
    } else {
      // Validate connections
      const nodeIds = new Set(workflow.nodes?.map((n: any) => n.id) || []);
      workflow.connections.forEach((conn: any, index: number) => {
        if (!conn.sourceNodeId || !conn.targetNodeId) {
          errors.push(`Connection at index ${index} missing source or target`);
        } else {
          if (!nodeIds.has(conn.sourceNodeId)) {
            errors.push(
              `Connection at index ${index} references non-existent source node`,
            );
          }
          if (!nodeIds.has(conn.targetNodeId)) {
            errors.push(
              `Connection at index ${index} references non-existent target node`,
            );
          }
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private sanitizeNodeConfiguration(
    configuration: Record<string, any>,
    includeCredentials?: boolean,
  ): Record<string, any> {
    if (includeCredentials) {
      return configuration;
    }

    // Remove sensitive data like API keys, tokens, etc.
    const sanitized = { ...configuration };
    const sensitiveKeys = [
      'apiKey',
      'token',
      'secret',
      'password',
      'credential',
    ];

    Object.keys(sanitized).forEach((key) => {
      if (
        sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))
      ) {
        delete sanitized[key];
      }
    });

    return sanitized;
  }
}
