export const WORKFLOW_EXECUTION_QUEUE = 'workflow-execution';
export const WORKFLOW_NODE_QUEUE = 'workflow-node';

export enum WorkflowJobType {
  EXECUTE_WORKFLOW = 'execute-workflow',
  EXECUTE_NODE = 'execute-node',
  RESUME_WORKFLOW = 'resume-workflow',
  CANCEL_WORKFLOW = 'cancel-workflow',
  RETRY_NODE = 'retry-node',
}

export enum NodeJobType {
  EXECUTE = 'execute',
  RETRY = 'retry',
  TIMEOUT = 'timeout',
}
