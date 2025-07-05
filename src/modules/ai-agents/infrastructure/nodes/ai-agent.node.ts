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
        editor: 'multiline',
        rows: 4,
      },
      placeholder: 'Enter a custom prompt or leave empty to use input data',
      description: 'Optional custom prompt to override the input data',
    },
    {
      name: 'sessionId',
      displayName: 'Session ID',
      type: 'string',
      placeholder: 'auto-generated',
      description: 'Session ID for memory persistence (auto-generated if empty)',
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
        minValue: 0,
        maxValue: 2,
        numberPrecision: 2,
      },
      placeholder: 'Use agent default',
      description: 'Override the agent\'s temperature setting',
    },
    {
      name: 'maxTokens',
      displayName: 'Max Tokens Override',
      type: 'number',
      typeOptions: {
        minValue: 1,
        maxValue: 4000,
      },
      placeholder: 'Use agent default',
      description: 'Override the agent\'s max tokens setting',
    },
    {
      name: 'toolsOverride',
      displayName: 'Tools Override',
      type: 'multiOptions',
      typeOptions: {
        loadOptionsMethod: 'getAvailableTools',
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
      description: 'How to format the agent\'s response',
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
        minValue: 5,
        maxValue: 300,
      },
      description: 'Maximum execution time before timeout',
    },
    {
      name: 'retryAttempts',
      displayName: 'Retry Attempts',
      type: 'number',
      default: 0,
      typeOptions: {
        minValue: 0,
        maxValue: 5,
      },
      description: 'Number of retry attempts on failure',
    },
  ],
  // Methods for loading options dynamically
  methods: {
    loadOptions: {
      async getAgents() {
        // This method will be called by the frontend to load available agents
        // It should return a list of { name, value } objects
        return [
          { name: 'Loading agents...', value: '' }
        ];
      },
      async getAvailableTools() {
        // This method will be called to load available tools
        return [
          { name: 'HTTP Request', value: 'http_request' },
          { name: 'Workflow Data', value: 'workflow_data' },
          { name: 'Text Processor', value: 'text_processor' },
          { name: 'Date Time', value: 'date_time' },
          { name: 'JSON Parser', value: 'json_parser' },
          { name: 'Calculator', value: 'calculator' },
        ];
      },
    },
  },
});

export { AIAgentNodeExecutor };
