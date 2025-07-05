import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { WorkflowNode } from '../../../domain/entities/workflow-node.entity';
import { NodeExecutor } from '../node-executor.interface';
import { CredentialIntegrationService } from '../../../../credentials/application/services/credential-integration.service';

export interface GitHubConfig {
  operation: 'createIssue' | 'updateIssue' | 'closeIssue' | 'createPullRequest' | 'createRepository' | 'getIssues' | 'getRepositories' | 'createComment' | 'starRepository' | 'forkRepository';
  credentialId?: string;
  accessToken?: string;
  owner?: string;
  repo?: string;
  // Issue fields
  title?: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
  milestone?: number;
  issueNumber?: number;
  state?: 'open' | 'closed';
  // Pull request fields
  head?: string;
  base?: string;
  draft?: boolean;
  // Repository fields
  repositoryName?: string;
  description?: string;
  private?: boolean;
  hasIssues?: boolean;
  hasProjects?: boolean;
  hasWiki?: boolean;
  // Comment fields
  commentBody?: string;
  commentId?: number;
  // Query parameters
  query?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

@Injectable()
export class GitHubNodeExecutor implements NodeExecutor {
  private readonly logger = new Logger(GitHubNodeExecutor.name);

  constructor(
    private httpService: HttpService,
    private credentialIntegrationService: CredentialIntegrationService,
  ) {}

  async execute(
    node: WorkflowNode,
    inputData: Record<string, any>,
    executionId: string,
  ): Promise<Record<string, any>> {
    const config = node.configuration as GitHubConfig;
    this.logger.log(`Executing GitHub operation: ${config.operation}`);

    try {
      const accessToken = await this.getAccessToken(config, inputData);
      let result: any;

      switch (config.operation) {
        case 'createIssue':
          result = await this.createIssue(config, inputData, accessToken);
          break;
        case 'updateIssue':
          result = await this.updateIssue(config, inputData, accessToken);
          break;
        case 'closeIssue':
          result = await this.closeIssue(config, inputData, accessToken);
          break;
        case 'createPullRequest':
          result = await this.createPullRequest(config, inputData, accessToken);
          break;
        case 'createRepository':
          result = await this.createRepository(config, inputData, accessToken);
          break;
        case 'getIssues':
          result = await this.getIssues(config, inputData, accessToken);
          break;
        case 'getRepositories':
          result = await this.getRepositories(config, inputData, accessToken);
          break;
        case 'createComment':
          result = await this.createComment(config, inputData, accessToken);
          break;
        case 'starRepository':
          result = await this.starRepository(config, inputData, accessToken);
          break;
        case 'forkRepository':
          result = await this.forkRepository(config, inputData, accessToken);
          break;
        default:
          throw new Error(`Unsupported GitHub operation: ${config.operation}`);
      }

      return {
        ...inputData,
        github: result,
        _github: {
          nodeId: node.id,
          nodeName: node.name,
          operation: config.operation,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`GitHub operation failed: ${error.message}`);
      
      return {
        ...inputData,
        github: null,
        githubError: error.message,
        _github: {
          nodeId: node.id,
          nodeName: node.name,
          operation: config.operation,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  async validate(configuration: Record<string, any>): Promise<boolean> {
    const config = configuration as GitHubConfig;
    
    if (!config.operation) return false;
    if (!config.accessToken && !config.credentialId) return false;

    switch (config.operation) {
      case 'createIssue':
        return !!(config.owner && config.repo && config.title);
      case 'updateIssue':
      case 'closeIssue':
        return !!(config.owner && config.repo && config.issueNumber);
      case 'createPullRequest':
        return !!(config.owner && config.repo && config.title && config.head && config.base);
      case 'createRepository':
        return !!config.repositoryName;
      case 'getIssues':
        return !!(config.owner && config.repo);
      case 'getRepositories':
        return true; // No specific validation needed
      case 'createComment':
        return !!(config.owner && config.repo && config.issueNumber && config.commentBody);
      case 'starRepository':
      case 'forkRepository':
        return !!(config.owner && config.repo);
      default:
        return false;
    }
  }

  private async getAccessToken(config: GitHubConfig, inputData: Record<string, any>): Promise<string> {
    if (config.accessToken) {
      return this.replaceVariables(config.accessToken, inputData);
    }

    if (config.credentialId) {
      try {
        const credential = await this.credentialIntegrationService.getCredentialById(
          config.credentialId,
          inputData._credentialContext
        );
        return credential.data.access_token;
      } catch (error) {
        this.logger.error(`Failed to get GitHub credential: ${error.message}`);
        throw new Error(`Failed to retrieve GitHub credentials: ${error.message}`);
      }
    }

    // Try to get credential by service name
    if (inputData._credentialContext) {
      try {
        const credential = await this.credentialIntegrationService.getCredentialByService(
          'github',
          inputData._credentialContext
        );
        return credential.data.access_token;
      } catch (error) {
        this.logger.error(`Failed to get GitHub credential by service: ${error.message}`);
      }
    }

    throw new Error('No GitHub access token or credential ID provided');
  }

  private async createIssue(
    config: GitHubConfig,
    inputData: Record<string, any>,
    accessToken: string,
  ): Promise<any> {
    const owner = this.replaceVariables(config.owner!, inputData);
    const repo = this.replaceVariables(config.repo!, inputData);
    const title = this.replaceVariables(config.title!, inputData);
    const body = config.body ? this.replaceVariables(config.body, inputData) : '';

    const payload: any = {
      title,
      body,
    };

    if (config.labels && config.labels.length > 0) {
      payload.labels = config.labels;
    }

    if (config.assignees && config.assignees.length > 0) {
      payload.assignees = config.assignees;
    }

    if (config.milestone) {
      payload.milestone = config.milestone;
    }

    const response = await lastValueFrom(
      this.httpService.post(
        `https://api.github.com/repos/${owner}/${repo}/issues`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return {
      id: response.data.id,
      number: response.data.number,
      title: response.data.title,
      body: response.data.body,
      state: response.data.state,
      url: response.data.html_url,
      user: response.data.user.login,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
      labels: response.data.labels.map((label: any) => label.name),
      assignees: response.data.assignees.map((assignee: any) => assignee.login),
    };
  }

  private async updateIssue(
    config: GitHubConfig,
    inputData: Record<string, any>,
    accessToken: string,
  ): Promise<any> {
    const owner = this.replaceVariables(config.owner!, inputData);
    const repo = this.replaceVariables(config.repo!, inputData);
    const issueNumber = this.replaceVariables(config.issueNumber!.toString(), inputData);

    const payload: any = {};

    if (config.title) {
      payload.title = this.replaceVariables(config.title, inputData);
    }

    if (config.body) {
      payload.body = this.replaceVariables(config.body, inputData);
    }

    if (config.state) {
      payload.state = config.state;
    }

    if (config.labels) {
      payload.labels = config.labels;
    }

    if (config.assignees) {
      payload.assignees = config.assignees;
    }

    const response = await lastValueFrom(
      this.httpService.patch(
        `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return {
      id: response.data.id,
      number: response.data.number,
      title: response.data.title,
      body: response.data.body,
      state: response.data.state,
      url: response.data.html_url,
      updatedAt: response.data.updated_at,
    };
  }

  private async closeIssue(
    config: GitHubConfig,
    inputData: Record<string, any>,
    accessToken: string,
  ): Promise<any> {
    const owner = this.replaceVariables(config.owner!, inputData);
    const repo = this.replaceVariables(config.repo!, inputData);
    const issueNumber = this.replaceVariables(config.issueNumber!.toString(), inputData);

    const response = await lastValueFrom(
      this.httpService.patch(
        `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
        { state: 'closed' },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return {
      id: response.data.id,
      number: response.data.number,
      title: response.data.title,
      state: response.data.state,
      url: response.data.html_url,
      closedAt: response.data.closed_at,
    };
  }

  private async createPullRequest(
    config: GitHubConfig,
    inputData: Record<string, any>,
    accessToken: string,
  ): Promise<any> {
    const owner = this.replaceVariables(config.owner!, inputData);
    const repo = this.replaceVariables(config.repo!, inputData);
    const title = this.replaceVariables(config.title!, inputData);
    const head = this.replaceVariables(config.head!, inputData);
    const base = this.replaceVariables(config.base!, inputData);
    const body = config.body ? this.replaceVariables(config.body, inputData) : '';

    const payload: any = {
      title,
      head,
      base,
      body,
    };

    if (config.draft) {
      payload.draft = config.draft;
    }

    const response = await lastValueFrom(
      this.httpService.post(
        `https://api.github.com/repos/${owner}/${repo}/pulls`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return {
      id: response.data.id,
      number: response.data.number,
      title: response.data.title,
      body: response.data.body,
      state: response.data.state,
      url: response.data.html_url,
      head: response.data.head.ref,
      base: response.data.base.ref,
      user: response.data.user.login,
      createdAt: response.data.created_at,
      draft: response.data.draft,
    };
  }

  private async createRepository(
    config: GitHubConfig,
    inputData: Record<string, any>,
    accessToken: string,
  ): Promise<any> {
    const repositoryName = this.replaceVariables(config.repositoryName!, inputData);
    const description = config.description ? this.replaceVariables(config.description, inputData) : '';

    const payload: any = {
      name: repositoryName,
      description,
      private: config.private || false,
      has_issues: config.hasIssues !== false,
      has_projects: config.hasProjects !== false,
      has_wiki: config.hasWiki !== false,
    };

    const response = await lastValueFrom(
      this.httpService.post(
        'https://api.github.com/user/repos',
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return {
      id: response.data.id,
      name: response.data.name,
      fullName: response.data.full_name,
      description: response.data.description,
      private: response.data.private,
      url: response.data.html_url,
      cloneUrl: response.data.clone_url,
      sshUrl: response.data.ssh_url,
      owner: response.data.owner.login,
      createdAt: response.data.created_at,
    };
  }

  private async getIssues(
    config: GitHubConfig,
    inputData: Record<string, any>,
    accessToken: string,
  ): Promise<any> {
    const owner = this.replaceVariables(config.owner!, inputData);
    const repo = this.replaceVariables(config.repo!, inputData);
    
    const queryParams = new URLSearchParams();
    if (config.state) queryParams.append('state', config.state);
    if (config.sort) queryParams.append('sort', config.sort);
    if (config.direction) queryParams.append('direction', config.direction);
    if (config.per_page) queryParams.append('per_page', config.per_page.toString());
    if (config.page) queryParams.append('page', config.page.toString());

    const response = await lastValueFrom(
      this.httpService.get(
        `https://api.github.com/repos/${owner}/${repo}/issues?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        },
      ),
    );

    return {
      issues: response.data.map((issue: any) => ({
        id: issue.id,
        number: issue.number,
        title: issue.title,
        body: issue.body,
        state: issue.state,
        url: issue.html_url,
        user: issue.user.login,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
        labels: issue.labels.map((label: any) => label.name),
        assignees: issue.assignees.map((assignee: any) => assignee.login),
      })),
      totalCount: response.data.length,
    };
  }

  private async getRepositories(
    config: GitHubConfig,
    inputData: Record<string, any>,
    accessToken: string,
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    if (config.sort) queryParams.append('sort', config.sort);
    if (config.direction) queryParams.append('direction', config.direction);
    if (config.per_page) queryParams.append('per_page', config.per_page.toString());
    if (config.page) queryParams.append('page', config.page.toString());

    const response = await lastValueFrom(
      this.httpService.get(
        `https://api.github.com/user/repos?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        },
      ),
    );

    return {
      repositories: response.data.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        url: repo.html_url,
        cloneUrl: repo.clone_url,
        sshUrl: repo.ssh_url,
        owner: repo.owner.login,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        stargazersCount: repo.stargazers_count,
        forksCount: repo.forks_count,
        language: repo.language,
      })),
      totalCount: response.data.length,
    };
  }

  private async createComment(
    config: GitHubConfig,
    inputData: Record<string, any>,
    accessToken: string,
  ): Promise<any> {
    const owner = this.replaceVariables(config.owner!, inputData);
    const repo = this.replaceVariables(config.repo!, inputData);
    const issueNumber = this.replaceVariables(config.issueNumber!.toString(), inputData);
    const body = this.replaceVariables(config.commentBody!, inputData);

    const response = await lastValueFrom(
      this.httpService.post(
        `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
        { body },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return {
      id: response.data.id,
      body: response.data.body,
      user: response.data.user.login,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
      url: response.data.html_url,
    };
  }

  private async starRepository(
    config: GitHubConfig,
    inputData: Record<string, any>,
    accessToken: string,
  ): Promise<any> {
    const owner = this.replaceVariables(config.owner!, inputData);
    const repo = this.replaceVariables(config.repo!, inputData);

    await lastValueFrom(
      this.httpService.put(
        `https://api.github.com/user/starred/${owner}/${repo}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        },
      ),
    );

    return {
      owner,
      repo,
      status: 'starred',
      timestamp: new Date().toISOString(),
    };
  }

  private async forkRepository(
    config: GitHubConfig,
    inputData: Record<string, any>,
    accessToken: string,
  ): Promise<any> {
    const owner = this.replaceVariables(config.owner!, inputData);
    const repo = this.replaceVariables(config.repo!, inputData);

    const response = await lastValueFrom(
      this.httpService.post(
        `https://api.github.com/repos/${owner}/${repo}/forks`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        },
      ),
    );

    return {
      id: response.data.id,
      name: response.data.name,
      fullName: response.data.full_name,
      description: response.data.description,
      private: response.data.private,
      url: response.data.html_url,
      cloneUrl: response.data.clone_url,
      sshUrl: response.data.ssh_url,
      owner: response.data.owner.login,
      parent: response.data.parent.full_name,
      createdAt: response.data.created_at,
    };
  }

  private replaceVariables(str: string, data: Record<string, any>): string {
    return str.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const keys = key.trim().split('.');
      let value = data;

      for (const k of keys) {
        value = value?.[k];
      }

      return value !== undefined ? String(value) : match;
    });
  }
}
