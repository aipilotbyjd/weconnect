import { WorkflowNode } from '../../domain/entities/workflow-node.entity';
import { WorkflowNodeConnection } from '../../domain/entities/workflow-node-connection.entity';

export interface ConnectionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ConnectionValidator {
  /**
   * Validates workflow connections to ensure they form a valid DAG (Directed Acyclic Graph)
   */
  static validateConnections(
    nodes: WorkflowNode[],
    connections: WorkflowNodeConnection[]
  ): ConnectionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Create node ID set for quick lookup
    const nodeIds = new Set(nodes.map(node => node.id));

    // Validate each connection
    for (const connection of connections) {
      // Check if source and target nodes exist
      if (!nodeIds.has(connection.sourceNodeId)) {
        errors.push(`Source node ${connection.sourceNodeId} not found`);
      }

      if (!nodeIds.has(connection.targetNodeId)) {
        errors.push(`Target node ${connection.targetNodeId} not found`);
      }

      // Check for self-loops
      if (connection.sourceNodeId === connection.targetNodeId) {
        errors.push(`Self-loop detected on node ${connection.sourceNodeId}`);
      }
    }

    // Check for cycles using DFS
    const cycleResult = this.detectCycles(nodes, connections);
    if (cycleResult.hasCycle) {
      errors.push(`Cycle detected: ${cycleResult.cyclePath?.join(' → ')}`);
    }

    // Check for isolated nodes (nodes with no connections)
    const connectedNodes = new Set([
      ...connections.map(c => c.sourceNodeId),
      ...connections.map(c => c.targetNodeId),
    ]);

    const isolatedNodes = nodes.filter(node => !connectedNodes.has(node.id));
    if (isolatedNodes.length > 0) {
      warnings.push(`Isolated nodes detected: ${isolatedNodes.map(n => n.name).join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Detects cycles in the workflow graph using DFS
   */
  static detectCycles(
    nodes: WorkflowNode[],
    connections: WorkflowNodeConnection[]
  ): { hasCycle: boolean; cyclePath?: string[] } {
    // Build adjacency list
    const adjacencyList = new Map<string, string[]>();
    
    // Initialize adjacency list
    nodes.forEach(node => {
      adjacencyList.set(node.id, []);
    });

    // Populate adjacency list with connections
    connections.forEach(connection => {
      const sourceConnections = adjacencyList.get(connection.sourceNodeId) || [];
      sourceConnections.push(connection.targetNodeId);
      adjacencyList.set(connection.sourceNodeId, sourceConnections);
    });

    // DFS cycle detection using colors: WHITE (0), GRAY (1), BLACK (2)
    const colors = new Map<string, number>();
    const path: string[] = [];

    // Initialize all nodes as WHITE
    nodes.forEach(node => {
      colors.set(node.id, 0);
    });

    // DFS function
    const dfs = (nodeId: string): boolean => {
      colors.set(nodeId, 1); // Mark as GRAY (visiting)
      path.push(nodeId);

      const neighbors = adjacencyList.get(nodeId) || [];
      
      for (const neighbor of neighbors) {
        const neighborColor = colors.get(neighbor);
        
        if (neighborColor === 1) {
          // Back edge found - cycle detected
          const cycleStart = path.indexOf(neighbor);
          return true;
        }
        
        if (neighborColor === 0 && dfs(neighbor)) {
          return true;
        }
      }

      colors.set(nodeId, 2); // Mark as BLACK (visited)
      path.pop();
      return false;
    };

    // Check each component
    for (const node of nodes) {
      if (colors.get(node.id) === 0) {
        if (dfs(node.id)) {
          return { hasCycle: true, cyclePath: [...path] };
        }
      }
    }

    return { hasCycle: false };
  }

  /**
   * Gets the execution order of nodes using topological sorting
   */
  static getExecutionOrder(
    nodes: WorkflowNode[],
    connections: WorkflowNodeConnection[]
  ): string[] {
    // Build adjacency list and in-degree count
    const adjacencyList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize
    nodes.forEach(node => {
      adjacencyList.set(node.id, []);
      inDegree.set(node.id, 0);
    });

    // Build graph
    connections.forEach(connection => {
      const sourceConnections = adjacencyList.get(connection.sourceNodeId) || [];
      sourceConnections.push(connection.targetNodeId);
      adjacencyList.set(connection.sourceNodeId, sourceConnections);

      const currentInDegree = inDegree.get(connection.targetNodeId) || 0;
      inDegree.set(connection.targetNodeId, currentInDegree + 1);
    });

    // Topological sort using Kahn's algorithm
    const queue: string[] = [];
    const result: string[] = [];

    // Find all nodes with no incoming edges
    nodes.forEach(node => {
      if (inDegree.get(node.id) === 0) {
        queue.push(node.id);
      }
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      // Remove this node from the graph
      const neighbors = adjacencyList.get(current) || [];
      neighbors.forEach(neighbor => {
        const neighborInDegree = inDegree.get(neighbor)! - 1;
        inDegree.set(neighbor, neighborInDegree);

        if (neighborInDegree === 0) {
          queue.push(neighbor);
        }
      });
    }

    return result;
  }

  /**
   * Finds all paths from source to target nodes
   */
  static findPaths(
    sourceNodeId: string,
    targetNodeId: string,
    connections: WorkflowNodeConnection[]
  ): string[][] {
    const adjacencyList = new Map<string, string[]>();
    
    // Build adjacency list
    connections.forEach(connection => {
      const sourceConnections = adjacencyList.get(connection.sourceNodeId) || [];
      sourceConnections.push(connection.targetNodeId);
      adjacencyList.set(connection.sourceNodeId, sourceConnections);
    });

    const paths: string[][] = [];
    const currentPath: string[] = [];

    const dfs = (currentNode: string, visited: Set<string>) => {
      currentPath.push(currentNode);
      visited.add(currentNode);

      if (currentNode === targetNodeId) {
        paths.push([...currentPath]);
      } else {
        const neighbors = adjacencyList.get(currentNode) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            dfs(neighbor, new Set(visited));
          }
        }
      }

      currentPath.pop();
    };

    dfs(sourceNodeId, new Set());
    return paths;
  }
}
