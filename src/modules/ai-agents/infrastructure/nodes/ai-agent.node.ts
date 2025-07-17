import { NodeDefinition } from '../../../nodes/domain/entities/node-definition.entity';
import { AIAgentNodeExecutor } from '../executors/ai-agent-node.executor';

export const AIAgentNodeDefinition = new NodeDefinition({
  name: 'AIAgent',
  displayName: 'AI Agent',
  description: 'Execute an AI agent with configurable LLM, tools, and memory',
  version: 1,
  group: ['AI', 'artificial-intelligence'],
  icon: 'fa:robot',
  defaults: {
    name: 'AI Agent',
    color: '#FF6B35',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [],
  properties: [
    {
      name: 'agentId',
      displayName: 'AI Agent',
      type: 'options',
      typeOptions: {
        loadOptionsMethod: 'getAgents',
      },
      required: true,
      default: '',
      description: 'Select the AI agent to execute',
    },
    {
      name: 'prompt',
      displayName: 'Custom Prompt',
      type: 'string',
      typeOptions: {
        multipleValues: false,
      },
      placeholder: 'Enter a custom prompt or leave empty to use input data',
      description: 'Optional custom prompt to override the input data',
    },
    {
      name: 'sessionId',
      displayName: 'Session ID',
      type: 'string',
      placeholder: 'auto-generated',
      description:
        'Session ID for memory persistence (auto-generated if empty)',
    },
    {
      name: 'includeWorkflowContext',
      displayName: 'Include Workflow Context',
      type: 'boolean',
      default: true,
      description: 'Include data from previous workflow nodes in the context',
    },
    {
      name: 'temperature',
      displayName: 'Temperature Override',
      type: 'number',
      typeOptions: {
        multipleValues: false,
      },
      placeholder: 'Use agent default',
      description: "Override the agent's temperature setting",
    },
    {
      name: 'maxTokens',
      displayName: 'Max Tokens Override',
      type: 'number',
      typeOptions: {
        multipleValues: false,
      },
      placeholder: 'Use agent default',
      description: "Override the agent's max tokens setting",
    },
    {
      name: 'toolsOverride',
      displayName: 'Tools Override',
      type: 'collection',
      typeOptions: {
        loadOptionsMethod: 'getAvailableTools',
        multipleValues: true,
      },
      placeholder: 'Use agent default tools',
      description: 'Override which tools the agent can use',
    },
    {
      name: 'outputFormat',
      displayName: 'Output Format',
      type: 'options',
      options: [
        { name: 'Text', value: 'text' },
        { name: 'JSON', value: 'json' },
        { name: 'Structured', value: 'structured' },
      ],
      default: 'text',
      description: "How to format the agent's response",
    },
    {
      name: 'continueOnFailure',
      displayName: 'Continue on Failure',
      type: 'boolean',
      default: false,
      description: 'Continue workflow execution even if agent fails',
    },
    {
      name: 'timeout',
      displayName: 'Timeout (seconds)',
      type: 'number',
      default: 60,
      typeOptions: {
        multipleValues: false,
      },
      description: 'Maximum execution time before timeout',
    },
    {
      name: 'retryAttempts',
      displayName: 'Retry Attempts',
      type: 'number',
      default: 0,
      typeOptions: {
        multipleValues: false,
      },
      description: 'Number of retry attempts on failure',
    },
  ],
});

export { AIAgentNodeExecutor };
