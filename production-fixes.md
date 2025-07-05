# 🚨 Critical Production Fixes for WeConnect

## Priority 1: Fix Race Conditions

### 1. Add Node Execution Tracking
```typescript
// src/modules/workflows/application/services/workflow-execution.service.ts
export class WorkflowExecutionService {
  private readonly executingNodes = new Map<string, Set<string>>(); // executionId -> nodeIds

  private async executeNodeAndContinue(
    node: WorkflowNode,
    executionId: string,
    inputData?: Record<string, any>,
    visitedNodes = new Set<string>()
  ): Promise<Record<string, any>> {
    // Cycle detection
    if (visitedNodes.has(node.id)) {
      throw new Error(`Cycle detected at node: ${node.id}`);
    }
    visitedNodes.add(node.id);

    // Execution tracking
    if (!this.executingNodes.has(executionId)) {
      this.executingNodes.set(executionId, new Set());
    }
    const nodeSet = this.executingNodes.get(executionId)!;

    const result = await this.executeNode(node, executionId, inputData);
    const connections = await this.connectionRepository.find({
      where: { sourceNodeId: node.id },
      relations: ['targetNode'],
    });

    // Execute connected nodes with duplicate prevention
    const nodePromises = [];
    for (const connection of connections) {
      if (connection.targetNode?.isEnabled && 
          !nodeSet.has(connection.targetNode.id)) {
        
        const shouldExecute = this.shouldExecuteConnection(connection, result);
        if (shouldExecute) {
          nodeSet.add(connection.targetNode.id);
          
          const promise = this.nodeQueue.add(
            NodeJobType.EXECUTE,
            {
              nodeId: connection.targetNode.id,
              executionId,
              inputData: result,
              visitedNodes: Array.from(visitedNodes),
            },
          );
          nodePromises.push(promise);
        }
      }
    }

    // Wait for all nodes to be queued
    await Promise.allSettled(nodePromises);
    return result;
  }

  async cancelExecution(executionId: string): Promise<void> {
    // Clean up tracking
    this.executingNodes.delete(executionId);
    
    // Remove pending jobs
    const jobs = await this.nodeQueue.getJobs(['waiting', 'delayed']);
    for (const job of jobs) {
      if (job.data.executionId === executionId) {
        await job.remove();
      }
    }

    await this.executionRepository.update(executionId, {
      status: ExecutionStatus.CANCELLED,
    });
  }
}
```

### 2. Add Transaction Safety
```typescript
async startExecution(
  workflowId: string,
  userId: string,
  mode: ExecutionMode = ExecutionMode.MANUAL,
  inputData?: Record<string, any>,
): Promise<WorkflowExecution> {
  return await this.executionRepository.manager.transaction(async manager => {
    const execution = await manager.save(WorkflowExecution, {
      workflowId,
      status: ExecutionStatus.PENDING,
      mode,
      data: inputData || {},
      metadata: {
        userId,
        startedBy: mode,
      },
    });

    try {
      await this.workflowQueue.add(
        WorkflowJobType.EXECUTE_WORKFLOW,
        {
          executionId: execution.id,
          workflowId,
          userId,
          inputData,
        },
        {
          priority: mode === ExecutionMode.MANUAL ? 1 : 0,
        },
      );

      this.logger.log(`Created workflow execution ${execution.id}`);
      return execution;
    } catch (queueError) {
      // If queue fails, mark execution as failed
      await manager.update(WorkflowExecution, execution.id, {
        status: ExecutionStatus.FAILED,
        error: { message: 'Failed to queue execution', details: queueError.message },
      });
      throw queueError;
    }
  });
}
```

### 3. Add Workflow Timeout
```typescript
async executeWorkflow(
  workflow: Workflow,
  executionId: string,
  inputData?: Record<string, any>,
  timeout = 300000, // 5 minutes default
): Promise<Record<string, any>> {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Workflow execution timeout')), timeout);
  });

  const executionPromise = this.executeWorkflowInternal(workflow, executionId, inputData);

  try {
    return await Promise.race([executionPromise, timeoutPromise]);
  } catch (error) {
    // Cancel execution on timeout
    if (error.message === 'Workflow execution timeout') {
      await this.cancelExecution(executionId);
    }
    throw error;
  }
}
```

### 4. Fix Connection Logic
```typescript
private shouldExecuteConnection(
  connection: WorkflowNodeConnection,
  nodeOutput: Record<string, any>,
): boolean {
  // Check for explicit branch routing first
  if (nodeOutput._conditionBranch) {
    return connection.type === nodeOutput._conditionBranch;
  }
  
  // Generic error detection
  if (connection.type === ConnectionType.ERROR) {
    return nodeOutput.error === true || 
           nodeOutput.success === false ||
           nodeOutput.status === 'failed';
  }
  
  // Success path
  if (connection.type === ConnectionType.MAIN) {
    return nodeOutput.error !== true && 
           nodeOutput.success !== false &&
           nodeOutput.status !== 'failed';
  }
  
  // TRUE/FALSE for condition nodes
  if (connection.type === ConnectionType.TRUE) {
    return nodeOutput.result === true || nodeOutput.condition === true;
  }
  
  if (connection.type === ConnectionType.FALSE) {
    return nodeOutput.result === false || nodeOutput.condition === false;
  }
  
  return false;
}
```

## Priority 2: Enhanced Error Handling

### 5. Add Global Error Handler
```typescript
// src/modules/workflows/application/services/error-handling.service.ts
@Injectable()
export class ErrorHandlingService {
  async handleNodeError(
    nodeId: string,
    executionId: string,
    error: Error,
    retryCount = 0,
    maxRetries = 3,
  ): Promise<void> {
    if (retryCount < maxRetries) {
      // Exponential backoff retry
      const delay = Math.pow(2, retryCount) * 1000;
      
      await this.nodeQueue.add(
        NodeJobType.RETRY,
        { nodeId, executionId, retryCount: retryCount + 1 },
        { delay }
      );
    } else {
      // Mark execution as failed after max retries
      await this.executionRepository.update(executionId, {
        status: ExecutionStatus.FAILED,
        error: {
          message: error.message,
          stack: error.stack,
          failedNodeId: nodeId,
          maxRetriesExceeded: true,
        },
      });
    }
  }
}
```

## Priority 3: Resource Management

### 6. Add Cleanup Job
```typescript
// Add to workflow queue module
@Cron('0 */6 * * *') // Every 6 hours
async cleanupStaleExecutions() {
  const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
  
  const staleExecutions = await this.executionRepository.find({
    where: {
      status: In([ExecutionStatus.RUNNING, ExecutionStatus.PENDING]),
      createdAt: LessThan(staleThreshold),
    },
  });

  for (const execution of staleExecutions) {
    await this.cancelExecution(execution.id);
  }
}
```
