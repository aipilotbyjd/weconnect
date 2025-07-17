import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowVersion } from '../../domain/entities/workflow-version.entity';
import { Workflow } from '../../domain/entities/workflow.entity';
import { WorkflowNode } from '../../domain/entities/workflow-node.entity';
import { WorkflowNodeConnection } from '../../domain/entities/workflow-node-connection.entity';

@Injectable()
export class WorkflowVersioningService {
  constructor(
    @InjectRepository(WorkflowVersion)
    private versionRepository: Repository<WorkflowVersion>,
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowNode)
    private nodeRepository: Repository<WorkflowNode>,
    @InjectRepository(WorkflowNodeConnection)
    private connectionRepository: Repository<WorkflowNodeConnection>,
  ) {}

  async createVersion(
    workflowId: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      changelog?: string;
      isActive?: boolean;
    },
  ): Promise<WorkflowVersion> {
    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId, userId },
      relations: [
        'nodes',
        'nodes.outgoingConnections',
        'nodes.incomingConnections',
      ],
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    // Get the current version number
    const lastVersion = await this.versionRepository.findOne({
      where: { workflowId },
      order: { version: 'DESC' },
    });

    const newVersionNumber = (lastVersion?.version || 0) + 1;

    // Serialize current workflow state
    const definition = {
      nodes: workflow.nodes.map((node) => ({
        id: node.id,
        name: node.name,
        type: node.type,
        configuration: node.configuration,
        position: node.position,
        isEnabled: node.isEnabled,
        outgoingConnections: node.outgoingConnections.map((conn) => ({
          targetNodeId: conn.targetNodeId,
          type: conn.type,
          condition: conn.condition,
        })),
      })),
      configuration: workflow.configuration,
    };

    // If making this version active, deactivate others
    if (data.isActive) {
      await this.versionRepository.update({ workflowId }, { isActive: false });
    }

    const version = await this.versionRepository.save({
      workflowId,
      version: newVersionNumber,
      name: data.name || `v${newVersionNumber}`,
      description: data.description,
      changelog: data.changelog,
      definition,
      configuration: workflow.configuration,
      isActive: data.isActive || false,
      isPublished: false,
      createdBy: userId,
      previousVersionId: lastVersion?.id,
    });

    return version;
  }

  async getVersions(
    workflowId: string,
    userId: string,
  ): Promise<WorkflowVersion[]> {
    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId, userId },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    return this.versionRepository.find({
      where: { workflowId },
      order: { version: 'DESC' },
    });
  }

  async getVersion(
    workflowId: string,
    versionId: string,
    userId: string,
  ): Promise<WorkflowVersion> {
    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId, userId },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    const version = await this.versionRepository.findOne({
      where: { id: versionId, workflowId },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    return version;
  }

  async restoreVersion(
    workflowId: string,
    versionId: string,
    userId: string,
  ): Promise<Workflow> {
    const version = await this.getVersion(workflowId, versionId, userId);

    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId },
      relations: ['nodes'],
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    // Delete existing nodes and connections
    await this.nodeRepository.delete({ workflowId });

    // Restore nodes from version
    const nodeMap = new Map<string, WorkflowNode>();

    for (const nodeData of version.definition.nodes) {
      const node = await this.nodeRepository.save({
        workflowId,
        name: nodeData.name,
        type: nodeData.type,
        configuration: nodeData.configuration,
        position: nodeData.position,
        isEnabled: nodeData.isEnabled,
      });
      nodeMap.set(nodeData.id, node);
    }

    // Restore connections
    for (const nodeData of version.definition.nodes) {
      const sourceNode = nodeMap.get(nodeData.id);
      if (!sourceNode) continue;

      for (const connData of nodeData.outgoingConnections) {
        const targetNode = nodeMap.get(connData.targetNodeId);
        if (!targetNode) continue;

        await this.connectionRepository.save({
          sourceNodeId: sourceNode.id,
          targetNodeId: targetNode.id,
          type: connData.type,
          condition: connData.condition,
        });
      }
    }

    // Update workflow configuration
    workflow.configuration = version.configuration || {};
    await this.workflowRepository.save(workflow);

    // Mark this version as active
    await this.versionRepository.update({ workflowId }, { isActive: false });
    await this.versionRepository.update({ id: versionId }, { isActive: true });

    return workflow;
  }

  async compareVersions(
    workflowId: string,
    versionId1: string,
    versionId2: string,
    userId: string,
  ): Promise<{
    version1: WorkflowVersion;
    version2: WorkflowVersion;
    differences: {
      nodes: {
        added: any[];
        removed: any[];
        modified: any[];
      };
      connections: {
        added: any[];
        removed: any[];
      };
      configuration: {
        changed: Record<string, { old: any; new: any }>;
      };
    };
  }> {
    const version1 = await this.getVersion(workflowId, versionId1, userId);
    const version2 = await this.getVersion(workflowId, versionId2, userId);

    const nodes1Map = new Map(version1.definition.nodes.map((n) => [n.id, n]));
    const nodes2Map = new Map(version2.definition.nodes.map((n) => [n.id, n]));

    // Compare nodes
    const nodesAdded = version2.definition.nodes.filter(
      (n) => !nodes1Map.has(n.id),
    );
    const nodesRemoved = version1.definition.nodes.filter(
      (n) => !nodes2Map.has(n.id),
    );
    const nodesModified = version2.definition.nodes.filter((n) => {
      const old = nodes1Map.get(n.id);
      return old && JSON.stringify(old) !== JSON.stringify(n);
    });

    // Compare connections
    const conns1 = version1.definition.nodes.flatMap((n) =>
      n.outgoingConnections.map((c) => ({ ...c, sourceId: n.id })),
    );
    const conns2 = version2.definition.nodes.flatMap((n) =>
      n.outgoingConnections.map((c) => ({ ...c, sourceId: n.id })),
    );

    const connsAdded = conns2.filter(
      (c2) =>
        !conns1.some(
          (c1) =>
            c1.sourceId === c2.sourceId && c1.targetNodeId === c2.targetNodeId,
        ),
    );
    const connsRemoved = conns1.filter(
      (c1) =>
        !conns2.some(
          (c2) =>
            c1.sourceId === c2.sourceId && c1.targetNodeId === c2.targetNodeId,
        ),
    );

    // Compare configuration
    const configChanges: Record<string, { old: any; new: any }> = {};
    const allKeys = new Set([
      ...Object.keys(version1.configuration || {}),
      ...Object.keys(version2.configuration || {}),
    ]);

    for (const key of allKeys) {
      const val1 = version1.configuration?.[key];
      const val2 = version2.configuration?.[key];
      if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        configChanges[key] = { old: val1, new: val2 };
      }
    }

    return {
      version1,
      version2,
      differences: {
        nodes: {
          added: nodesAdded,
          removed: nodesRemoved,
          modified: nodesModified,
        },
        connections: {
          added: connsAdded,
          removed: connsRemoved,
        },
        configuration: {
          changed: configChanges,
        },
      },
    };
  }

  async publishVersion(
    workflowId: string,
    versionId: string,
    userId: string,
  ): Promise<WorkflowVersion> {
    const version = await this.getVersion(workflowId, versionId, userId);

    version.isPublished = true;
    return this.versionRepository.save(version);
  }

  async deleteVersion(
    workflowId: string,
    versionId: string,
    userId: string,
  ): Promise<void> {
    const version = await this.getVersion(workflowId, versionId, userId);

    if (version.isActive) {
      throw new BadRequestException('Cannot delete the active version');
    }

    await this.versionRepository.delete(versionId);
  }
}
