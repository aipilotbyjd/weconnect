import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../domain/interfaces/node-executor.interface';

export const GitHubNodeDefinition = new NodeDefinition({
  name: 'GitHub',
  displayName: 'GitHub',
  description: 'Interact with GitHub repositories',
  version: 1,
  group: ['development'],
  icon: 'fa:github',
  defaults: {
    name: 'GitHub',
    color: '#24292e',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'githubApi',
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
        { name: 'Get Repository', value: 'getRepository' },
        { name: 'List Issues', value: 'listIssues' },
        { name: 'Create PR', value: 'createPR' },
      ],
      default: 'createIssue',
      required: true,
    },
    {
      name: 'owner',
      displayName: 'Owner',
      type: 'string',
      required: true,
      placeholder: 'octocat',
      description: 'Repository owner (username or organization)',
    },
    {
      name: 'repo',
      displayName: 'Repository',
      type: 'string',
      required: true,
      placeholder: 'Hello-World',
      description: 'Repository name',
    },
    {
      name: 'title',
      displayName: 'Title',
      type: 'string',
      required: false,
      placeholder: 'Issue or PR title',
      description: 'Title for issue or PR',
    },
    {
      name: 'body',
      displayName: 'Body',
      type: 'string',
      required: false,
      placeholder: 'Description',
      description: 'Body content for issue or PR',
    },
    {
      name: 'labels',
      displayName: 'Labels',
      type: 'string',
      required: false,
      placeholder: 'bug,enhancement',
      description: 'Comma-separated list of labels',
    },
  ],
});

export class GitHubNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    
    try {
      const { operation, owner, repo, title, body, labels } = context.parameters;
      
      // Simulate GitHub API integration
      // In a real implementation, you would use GitHub API (Octokit)
      
      if (operation === 'createIssue') {
        if (!title) {
          throw new Error('Title is required for creating issue');
        }
        
        const issueData = {
          id: Date.now(),
          number: Math.floor(Math.random() * 1000) + 1,
          title,
          body: body || '',
          labels: labels ? labels.split(',').map(l => l.trim()) : [],
          state: 'open',
          created_at: new Date().toISOString(),
          html_url: `https://github.com/${owner}/${repo}/issues/${Math.floor(Math.random() * 1000) + 1}`,
        };
        
        return {
          success: true,
          data: [issueData],
          metadata: {
            executionTime: Date.now() - startTime,
            itemsProcessed: 1,
            operation: 'createIssue',
          },
        };
      } else if (operation === 'getRepository') {
        // Simulate getting repository
        const repoData = {
          id: Date.now(),
          name: repo,
          full_name: `${owner}/${repo}`,
          description: 'Sample repository description',
          html_url: `https://github.com/${owner}/${repo}`,
          clone_url: `https://github.com/${owner}/${repo}.git`,
          created_at: new Date().toISOString(),
          language: 'TypeScript',
          stargazers_count: 42,
          forks_count: 7,
        };
        
        return {
          success: true,
          data: [repoData],
          metadata: {
            executionTime: Date.now() - startTime,
            itemsProcessed: 1,
            operation: 'getRepository',
          },
        };
      } else if (operation === 'listIssues') {
        // Simulate listing issues
        const issuesList = [
          {
            id: 1,
            number: 1,
            title: 'Sample Issue 1',
            body: 'This is the first issue',
            state: 'open',
            created_at: new Date().toISOString(),
            html_url: `https://github.com/${owner}/${repo}/issues/1`,
          },
          {
            id: 2,
            number: 2,
            title: 'Sample Issue 2',
            body: 'This is the second issue',
            state: 'closed',
            created_at: new Date().toISOString(),
            html_url: `https://github.com/${owner}/${repo}/issues/2`,
          },
        ];
        
        return {
          success: true,
          data: issuesList,
          metadata: {
            executionTime: Date.now() - startTime,
            itemsProcessed: issuesList.length,
            operation: 'listIssues',
          },
        };
      } else if (operation === 'createPR') {
        if (!title) {
          throw new Error('Title is required for creating PR');
        }
        
        const prData = {
          id: Date.now(),
          number: Math.floor(Math.random() * 100) + 1,
          title,
          body: body || '',
          state: 'open',
          created_at: new Date().toISOString(),
          html_url: `https://github.com/${owner}/${repo}/pull/${Math.floor(Math.random() * 100) + 1}`,
          head: { ref: 'feature-branch' },
          base: { ref: 'main' },
        };
        
        return {
          success: true,
          data: [prData],
          metadata: {
            executionTime: Date.now() - startTime,
            itemsProcessed: 1,
            operation: 'createPR',
          },
        };
      }
      
      throw new Error(`Unknown operation: ${operation}`);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  }
}
