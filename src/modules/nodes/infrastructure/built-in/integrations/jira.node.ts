import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import {
  INodeExecutor,
  NodeExecutionContext,
  NodeExecutionResult,
} from '../../../../../core/abstracts/base-node.interface';
import axios, { AxiosInstance } from 'axios';

export const JiraNodeDefinition = new NodeDefinition({
  name: 'Jira',
  displayName: 'Jira',
  description:
    'Interact with Atlassian Jira for project management and issue tracking',
  version: 1,
  group: ['integrations', 'project-management'],
  icon: 'simple-icons:jira',
  defaults: {
    name: 'Jira',
    color: '#0052CC',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'jira',
      required: true,
    },
  ],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Create Issue', value: 'createIssue' },
        { name: 'Update Issue', value: 'updateIssue' },
        { name: 'Get Issue', value: 'getIssue' },
        { name: 'Delete Issue', value: 'deleteIssue' },
        { name: 'Search Issues', value: 'searchIssues' },
        { name: 'Assign Issue', value: 'assignIssue' },
        { name: 'Transition Issue', value: 'transitionIssue' },
        { name: 'Add Comment', value: 'addComment' },
        { name: 'Get Comments', value: 'getComments' },
        { name: 'Add Attachment', value: 'addAttachment' },
        { name: 'Get Projects', value: 'getProjects' },
        { name: 'Get Project', value: 'getProject' },
        { name: 'Get Issue Types', value: 'getIssueTypes' },
        { name: 'Get Transitions', value: 'getTransitions' },
        { name: 'Get Users', value: 'getUsers' },
        { name: 'Create Sprint', value: 'createSprint' },
        { name: 'Update Sprint', value: 'updateSprint' },
        { name: 'Get Sprints', value: 'getSprints' },
      ],
      default: 'searchIssues',
      required: true,
    },
    {
      name: 'issueKey',
      displayName: 'Issue Key',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: [
            'updateIssue',
            'getIssue',
            'deleteIssue',
            'assignIssue',
            'transitionIssue',
            'addComment',
            'getComments',
            'addAttachment',
            'getTransitions',
          ],
        },
      },
      required: true,
      description: 'The key of the issue (e.g., PROJECT-123)',
    },
    {
      name: 'projectKey',
      displayName: 'Project Key',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: [
            'createIssue',
            'getProject',
            'getIssueTypes',
            'createSprint',
            'getSprints',
          ],
        },
      },
      required: true,
      description: 'The key of the project',
    },
    {
      name: 'summary',
      displayName: 'Summary',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['createIssue', 'updateIssue'],
        },
      },
      required: true,
      description: 'Issue summary/title',
    },
    {
      name: 'description',
      displayName: 'Description',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['createIssue', 'updateIssue'],
        },
      },
      description: 'Issue description',
    },
    {
      name: 'issueType',
      displayName: 'Issue Type',
      type: 'options',
      options: [
        { name: 'Bug', value: 'Bug' },
        { name: 'Task', value: 'Task' },
        { name: 'Story', value: 'Story' },
        { name: 'Epic', value: 'Epic' },
        { name: 'Subtask', value: 'Sub-task' },
        { name: 'Improvement', value: 'Improvement' },
        { name: 'New Feature', value: 'New Feature' },
        { name: 'Custom', value: 'custom' },
      ],
      default: 'Task',
      displayOptions: {
        show: {
          operation: ['createIssue', 'updateIssue'],
        },
      },
      description: 'Type of the issue',
    },
    {
      name: 'customIssueType',
      displayName: 'Custom Issue Type',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          issueType: ['custom'],
        },
      },
      description: 'Name of the custom issue type',
    },
    {
      name: 'priority',
      displayName: 'Priority',
      type: 'options',
      options: [
        { name: 'Highest', value: 'Highest' },
        { name: 'High', value: 'High' },
        { name: 'Medium', value: 'Medium' },
        { name: 'Low', value: 'Low' },
        { name: 'Lowest', value: 'Lowest' },
      ],
      default: 'Medium',
      displayOptions: {
        show: {
          operation: ['createIssue', 'updateIssue'],
        },
      },
      description: 'Priority of the issue',
    },
    {
      name: 'assignee',
      displayName: 'Assignee',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['createIssue', 'updateIssue', 'assignIssue'],
        },
      },
      description: 'Username or account ID of the assignee',
    },
    {
      name: 'reporter',
      displayName: 'Reporter',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['createIssue', 'updateIssue'],
        },
      },
      description: 'Username or account ID of the reporter',
    },
    {
      name: 'labels',
      displayName: 'Labels',
      type: 'json',
      default: [],
      displayOptions: {
        show: {
          operation: ['createIssue', 'updateIssue'],
        },
      },
      description: 'Array of labels for the issue',
    },
    {
      name: 'components',
      displayName: 'Components',
      type: 'json',
      default: [],
      displayOptions: {
        show: {
          operation: ['createIssue', 'updateIssue'],
        },
      },
      description: 'Array of component names',
    },
    {
      name: 'customFields',
      displayName: 'Custom Fields',
      type: 'json',
      default: {},
      displayOptions: {
        show: {
          operation: ['createIssue', 'updateIssue'],
        },
      },
      description: 'Custom fields as key-value pairs',
    },
    {
      name: 'jql',
      displayName: 'JQL Query',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['searchIssues'],
        },
      },
      required: true,
      description: 'JQL query to search for issues',
    },
    {
      name: 'maxResults',
      displayName: 'Max Results',
      type: 'number',
      default: 50,
      displayOptions: {
        show: {
          operation: ['searchIssues', 'getUsers'],
        },
      },
      description: 'Maximum number of results to return',
    },
    {
      name: 'startAt',
      displayName: 'Start At',
      type: 'number',
      default: 0,
      displayOptions: {
        show: {
          operation: ['searchIssues'],
        },
      },
      description: 'Index of the first result to return',
    },
    {
      name: 'transitionId',
      displayName: 'Transition ID',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['transitionIssue'],
        },
      },
      required: true,
      description: 'ID of the transition to perform',
    },
    {
      name: 'comment',
      displayName: 'Comment',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['addComment', 'transitionIssue'],
        },
      },
      description: 'Comment text',
    },
    {
      name: 'filePath',
      displayName: 'File Path',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['addAttachment'],
        },
      },
      required: true,
      description: 'Path to the file to attach',
    },
    {
      name: 'sprintName',
      displayName: 'Sprint Name',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['createSprint', 'updateSprint'],
        },
      },
      required: true,
      description: 'Name of the sprint',
    },
    {
      name: 'sprintId',
      displayName: 'Sprint ID',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['updateSprint'],
        },
      },
      required: true,
      description: 'ID of the sprint to update',
    },
    {
      name: 'boardId',
      displayName: 'Board ID',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['createSprint', 'getSprints'],
        },
      },
      required: true,
      description: 'ID of the board for sprint operations',
    },
  ],
});

export class JiraNodeExecutor implements INodeExecutor {
  private client: AxiosInstance | null = null;

  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const credentials = context.credentials?.jira;

    if (!credentials) {
      return {
        success: false,
        error: 'Jira credentials not configured',
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }

    try {
      // Initialize Jira client
      this.client = axios.create({
        baseURL: `${credentials.domain}/rest/api/3`,
        auth: {
          username: credentials.email || credentials.username,
          password: credentials.apiToken || credentials.password,
        },
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      const { operation } = context.parameters;
      let result: any;

      switch (operation) {
        case 'createIssue':
          result = await this.createIssue(context);
          break;
        case 'updateIssue':
          result = await this.updateIssue(context);
          break;
        case 'getIssue':
          result = await this.getIssue(context);
          break;
        case 'deleteIssue':
          result = await this.deleteIssue(context);
          break;
        case 'searchIssues':
          result = await this.searchIssues(context);
          break;
        case 'assignIssue':
          result = await this.assignIssue(context);
          break;
        case 'transitionIssue':
          result = await this.transitionIssue(context);
          break;
        case 'addComment':
          result = await this.addComment(context);
          break;
        case 'getComments':
          result = await this.getComments(context);
          break;
        case 'addAttachment':
          result = await this.addAttachment(context);
          break;
        case 'getProjects':
          result = await this.getProjects(context);
          break;
        case 'getProject':
          result = await this.getProject(context);
          break;
        case 'getIssueTypes':
          result = await this.getIssueTypes(context);
          break;
        case 'getTransitions':
          result = await this.getTransitions(context);
          break;
        case 'getUsers':
          result = await this.getUsers(context);
          break;
        case 'createSprint':
          result = await this.createSprint(context);
          break;
        case 'updateSprint':
          result = await this.updateSprint(context);
          break;
        case 'getSprints':
          result = await this.getSprints(context);
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      return {
        success: true,
        data: result,
        metadata: {
          executionTime: Date.now() - startTime,
          operation,
          issueKey: context.parameters.issueKey,
          projectKey: context.parameters.projectKey,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.errorMessages?.[0] || error.message,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  private async createIssue(context: NodeExecutionContext): Promise<any> {
    const {
      projectKey,
      summary,
      description,
      issueType,
      customIssueType,
      priority,
      assignee,
      reporter,
      labels,
      components,
      customFields,
    } = context.parameters;

    const fields: any = {
      project: { key: projectKey },
      summary: summary,
      description: description
        ? {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: description }],
              },
            ],
          }
        : undefined,
      issuetype: { name: issueType === 'custom' ? customIssueType : issueType },
      priority: priority ? { name: priority } : undefined,
    };

    if (assignee) {
      fields.assignee = { accountId: assignee };
    }

    if (reporter) {
      fields.reporter = { accountId: reporter };
    }

    if (labels && labels.length > 0) {
      fields.labels = labels;
    }

    if (components && components.length > 0) {
      fields.components = components.map((name: string) => ({ name }));
    }

    // Add custom fields
    if (customFields && Object.keys(customFields).length > 0) {
      Object.assign(fields, customFields);
    }

    const response = await this.client!.post('/issue', { fields });

    return {
      id: response.data.id,
      key: response.data.key,
      self: response.data.self,
    };
  }

  private async updateIssue(context: NodeExecutionContext): Promise<any> {
    const {
      issueKey,
      summary,
      description,
      issueType,
      customIssueType,
      priority,
      assignee,
      labels,
      components,
      customFields,
    } = context.parameters;

    const fields: any = {};

    if (summary) fields.summary = summary;
    if (description) {
      fields.description = {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: description }],
          },
        ],
      };
    }
    if (issueType) {
      fields.issuetype = {
        name: issueType === 'custom' ? customIssueType : issueType,
      };
    }
    if (priority) fields.priority = { name: priority };
    if (assignee) fields.assignee = { accountId: assignee };
    if (labels) fields.labels = labels;
    if (components)
      fields.components = components.map((name: string) => ({ name }));

    // Add custom fields
    if (customFields && Object.keys(customFields).length > 0) {
      Object.assign(fields, customFields);
    }

    await this.client!.put(`/issue/${issueKey}`, { fields });

    return {
      key: issueKey,
      updated: true,
    };
  }

  private async getIssue(context: NodeExecutionContext): Promise<any> {
    const { issueKey } = context.parameters;

    const response = await this.client!.get(`/issue/${issueKey}`);

    return response.data;
  }

  private async deleteIssue(context: NodeExecutionContext): Promise<any> {
    const { issueKey } = context.parameters;

    await this.client!.delete(`/issue/${issueKey}`);

    return {
      key: issueKey,
      deleted: true,
    };
  }

  private async searchIssues(context: NodeExecutionContext): Promise<any> {
    const { jql, maxResults, startAt } = context.parameters;

    const response = await this.client!.post('/search', {
      jql: jql,
      maxResults: maxResults || 50,
      startAt: startAt || 0,
    });

    return {
      issues: response.data.issues,
      total: response.data.total,
      startAt: response.data.startAt,
      maxResults: response.data.maxResults,
    };
  }

  private async assignIssue(context: NodeExecutionContext): Promise<any> {
    const { issueKey, assignee } = context.parameters;

    await this.client!.put(`/issue/${issueKey}/assignee`, {
      accountId: assignee,
    });

    return {
      key: issueKey,
      assignee: assignee,
      assigned: true,
    };
  }

  private async transitionIssue(context: NodeExecutionContext): Promise<any> {
    const { issueKey, transitionId, comment } = context.parameters;

    const requestBody: any = {
      transition: { id: transitionId },
    };

    if (comment) {
      requestBody.update = {
        comment: [
          {
            add: {
              body: {
                type: 'doc',
                version: 1,
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: comment }],
                  },
                ],
              },
            },
          },
        ],
      };
    }

    await this.client!.post(`/issue/${issueKey}/transitions`, requestBody);

    return {
      key: issueKey,
      transitionId: transitionId,
      transitioned: true,
    };
  }

  private async addComment(context: NodeExecutionContext): Promise<any> {
    const { issueKey, comment } = context.parameters;

    const response = await this.client!.post(`/issue/${issueKey}/comment`, {
      body: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: comment }],
          },
        ],
      },
    });

    return response.data;
  }

  private async getComments(context: NodeExecutionContext): Promise<any> {
    const { issueKey } = context.parameters;

    const response = await this.client!.get(`/issue/${issueKey}/comment`);

    return {
      comments: response.data.comments,
      total: response.data.total,
      maxResults: response.data.maxResults,
      startAt: response.data.startAt,
    };
  }

  private async addAttachment(context: NodeExecutionContext): Promise<any> {
    const { issueKey, filePath } = context.parameters;

    const fs = require('fs');
    const FormData = require('form-data');

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const response = await this.client!.post(
      `/issue/${issueKey}/attachments`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'X-Atlassian-Token': 'no-check',
        },
      },
    );

    return response.data;
  }

  private async getProjects(context: NodeExecutionContext): Promise<any> {
    const response = await this.client!.get('/project');

    return response.data;
  }

  private async getProject(context: NodeExecutionContext): Promise<any> {
    const { projectKey } = context.parameters;

    const response = await this.client!.get(`/project/${projectKey}`);

    return response.data;
  }

  private async getIssueTypes(context: NodeExecutionContext): Promise<any> {
    const { projectKey } = context.parameters;

    const response = await this.client!.get(
      `/issuetype/project?projectId=${projectKey}`,
    );

    return response.data;
  }

  private async getTransitions(context: NodeExecutionContext): Promise<any> {
    const { issueKey } = context.parameters;

    const response = await this.client!.get(`/issue/${issueKey}/transitions`);

    return {
      transitions: response.data.transitions,
    };
  }

  private async getUsers(context: NodeExecutionContext): Promise<any> {
    const { maxResults } = context.parameters;

    const response = await this.client!.get('/users/search', {
      params: {
        maxResults: maxResults || 50,
      },
    });

    return response.data;
  }

  private async createSprint(context: NodeExecutionContext): Promise<any> {
    const { sprintName, boardId } = context.parameters;

    // Use Agile API for sprint operations
    const agileClient = axios.create({
      baseURL: `${this.client!.defaults.baseURL!.replace('/rest/api/3', '/rest/agile/1.0')}`,
      auth: this.client!.defaults.auth as any,
      headers: this.client!.defaults.headers as any,
    });

    const response = await agileClient.post('/sprint', {
      name: sprintName,
      originBoardId: parseInt(boardId),
    });

    return response.data;
  }

  private async updateSprint(context: NodeExecutionContext): Promise<any> {
    const { sprintId, sprintName } = context.parameters;

    const agileClient = axios.create({
      baseURL: `${this.client!.defaults.baseURL!.replace('/rest/api/3', '/rest/agile/1.0')}`,
      auth: this.client!.defaults.auth as any,
      headers: this.client!.defaults.headers as any,
    });

    const response = await agileClient.put(`/sprint/${sprintId}`, {
      name: sprintName,
    });

    return response.data;
  }

  private async getSprints(context: NodeExecutionContext): Promise<any> {
    const { boardId } = context.parameters;

    const agileClient = axios.create({
      baseURL: `${this.client!.defaults.baseURL!.replace('/rest/api/3', '/rest/agile/1.0')}`,
      auth: this.client!.defaults.auth as any,
      headers: this.client!.defaults.headers as any,
    });

    const response = await agileClient.get(`/board/${boardId}/sprint`);

    return {
      sprints: response.data.values,
      total: response.data.total,
      maxResults: response.data.maxResults,
      startAt: response.data.startAt,
    };
  }

  validate(configuration: Record<string, any>): boolean {
    // Basic validation - override in specific implementations
    return true;
  }

  getConfigurationSchema(): any {
    return {
      type: 'object',
      properties: {},
      required: [],
    };
  }
}
