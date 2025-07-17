import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NodeRegistryService } from '../../application/registry/node-registry.service';
import { BuiltInNodesService } from '../../application/registry/built-in-nodes.service';

@ApiTags('Nodes')
@Controller('nodes')
export class NodesController {
  constructor(
    private readonly nodeRegistry: NodeRegistryService,
    private readonly builtInNodesService: BuiltInNodesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all available nodes' })
  @ApiResponse({ status: 200, description: 'List of all registered nodes' })
  @ApiQuery({
    name: 'group',
    required: false,
    description: 'Filter by node group',
  })
  getAllNodes(@Query('group') group?: string) {
    if (group) {
      return {
        nodes: this.nodeRegistry.getNodesByGroup(group),
        total: this.nodeRegistry.getNodesByGroup(group).length,
      };
    }

    return {
      nodes: this.nodeRegistry.getAllNodeDefinitions(),
      total: this.nodeRegistry.getAllNodeDefinitions().length,
    };
  }

  @Get('groups')
  @ApiOperation({ summary: 'Get all node groups' })
  @ApiResponse({ status: 200, description: 'List of all node groups' })
  getNodeGroups() {
    const allNodes = this.nodeRegistry.getAllNodeDefinitions();
    const groups = new Set<string>();

    allNodes.forEach((node) => {
      node.group.forEach((g) => groups.add(g));
    });

    return {
      groups: Array.from(groups).sort(),
      total: groups.size,
    };
  }

  @Get(':nodeName')
  @ApiOperation({ summary: 'Get specific node definition' })
  @ApiResponse({ status: 200, description: 'Node definition found' })
  @ApiResponse({ status: 404, description: 'Node not found' })
  @ApiParam({ name: 'nodeName', description: 'Name of the node' })
  getNode(@Param('nodeName') nodeName: string) {
    const node = this.nodeRegistry.getNodeDefinition(nodeName);

    if (!node) {
      return {
        error: 'Node not found',
        nodeName,
      };
    }

    return {
      node,
      hasExecutor: this.nodeRegistry.getNodeExecutor(nodeName) !== undefined,
    };
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get nodes by category' })
  @ApiResponse({ status: 200, description: 'Nodes in the specified category' })
  @ApiParam({ name: 'category', description: 'Category name' })
  getNodesByCategory(@Param('category') category: string) {
    return {
      category,
      nodes: this.builtInNodesService.getNodesByCategory(category),
      total: this.builtInNodesService.getNodesByCategory(category).length,
    };
  }
}
