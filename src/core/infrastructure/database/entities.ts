// Central export of all domain entities

// Auth Module
export { User, UserRole } from '../../../modules/auth/domain/entities/user.entity';
export { ApiKey } from '../../../modules/auth/domain/entities/api-key.entity';
export { ExecutionLimit } from '../../../modules/auth/domain/entities/execution-limit.entity';

// Organizations Module
export { Organization, OrganizationPlan } from '../../../modules/organizations/domain/entities/organization.entity';
export { OrganizationMember } from '../../../modules/organizations/domain/entities/organization-member.entity';

// Credentials Module
export { Credential } from '../../../modules/credentials/domain/entities/credential.entity';

// Executions Module
export { Execution, ExecutionStatus, ExecutionMode } from '../../../modules/executions/domain/entities/execution.entity';
export { ExecutionLog, LogLevel } from '../../../modules/executions/domain/entities/execution-log.entity';

// Nodes Module
export { NodeDefinition } from '../../../modules/nodes/domain/entities/node-definition.entity';

// Webhooks Module
export { Webhook } from '../../../modules/webhooks/domain/entities/webhook.entity';

// Workflows Module
export { Workflow, WorkflowStatus } from '../../../modules/workflows/domain/entities/workflow.entity';
export { WorkflowNode } from '../../../modules/workflows/domain/entities/workflow-node.entity';
export { WorkflowNodeConnection } from '../../../modules/workflows/domain/entities/workflow-node-connection.entity';
export { WorkflowExecution, ExecutionStatus as WorkflowExecutionStatus, ExecutionMode as WorkflowExecutionMode } from '../../../modules/workflows/domain/entities/workflow-execution.entity';
export { WorkflowExecutionLog } from '../../../modules/workflows/domain/entities/workflow-execution-log.entity';
export { WorkflowVariable } from '../../../modules/workflows/domain/entities/workflow-variable.entity';
export { WorkflowVersion } from '../../../modules/workflows/domain/entities/workflow-version.entity';
export { WorkflowShare } from '../../../modules/workflows/domain/entities/workflow-share.entity';

// Templates Module
export { WorkflowTemplate } from '../../../modules/templates/domain/entities/workflow-template.entity';
export { TemplateCategory } from '../../../modules/templates/domain/entities/template-category.entity';
export { TemplateReview } from '../../../modules/templates/domain/entities/template-review.entity';

// Scheduler Module
export { ScheduledWorkflow } from '../../../modules/scheduler/domain/entities/scheduled-workflow.entity';

// Note: Monitoring entities will be added when the monitoring module is fully implemented

// AI Agents Module
export { AIAgent } from '../../../modules/ai-agents/domain/entities/ai-agent.entity';
export { AIAgentExecution } from '../../../modules/ai-agents/domain/entities/ai-agent-execution.entity';
export { AIAgentTool } from '../../../modules/ai-agents/domain/entities/ai-agent-tool.entity';
export { AIAgentMemory } from '../../../modules/ai-agents/domain/entities/ai-agent-memory.entity';
