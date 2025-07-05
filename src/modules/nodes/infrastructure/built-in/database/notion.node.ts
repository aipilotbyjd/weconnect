import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../domain/interfaces/node-executor.interface';
import { Client } from '@notionhq/client';

export const NotionNodeDefinition = new NodeDefinition({
  name: 'Notion',
  displayName: 'Notion Database',
  description: 'Interact with Notion workspace databases',
  version: 1,
  group: ['database', 'cloud'],
  icon: 'simple-icons:notion',
  defaults: {
    name: 'Notion',
    color: '#000000',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'notion',
      required: true,
    },
  ],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Query Database', value: 'queryDatabase' },
        { name: 'Get Database', value: 'getDatabase' },
        { name: 'Create Page', value: 'createPage' },
        { name: 'Update Page', value: 'updatePage' },
        { name: 'Get Page', value: 'getPage' },
        { name: 'Archive Page', value: 'archivePage' },
        { name: 'Get Block Children', value: 'getBlockChildren' },
        { name: 'Append Block Children', value: 'appendBlockChildren' },
      ],
      default: 'queryDatabase',
      required: true,
    },
    {
      name: 'databaseId',
      displayName: 'Database ID',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['queryDatabase', 'getDatabase', 'createPage'],
        },
      },
      required: true,
      description: 'The ID of the Notion database',
    },
    {
      name: 'pageId',
      displayName: 'Page ID',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['updatePage', 'getPage', 'archivePage', 'getBlockChildren', 'appendBlockChildren'],
        },
      },
      required: true,
      description: 'The ID of the Notion page',
    },
    {
      name: 'properties',
      displayName: 'Properties',
      type: 'json',
      default: {},
      displayOptions: {
        show: {
          operation: ['createPage', 'updatePage'],
        },
      },
      description: 'Page properties as key-value pairs',
    },
    {
      name: 'children',
      displayName: 'Children',
      type: 'json',
      default: [],
      displayOptions: {
        show: {
          operation: ['createPage', 'appendBlockChildren'],
        },
      },
      description: 'Array of block objects to add as children',
    },
    {
      name: 'filter',
      displayName: 'Filter',
      type: 'json',
      default: {},
      displayOptions: {
        show: {
          operation: ['queryDatabase'],
        },
      },
      description: 'Filter object for database queries',
    },
    {
      name: 'sorts',
      displayName: 'Sorts',
      type: 'json',
      default: [],
      displayOptions: {
        show: {
          operation: ['queryDatabase'],
        },
      },
      description: 'Array of sort objects',
    },
    {
      name: 'pageSize',
      displayName: 'Page Size',
      type: 'number',
      default: 100,
      displayOptions: {
        show: {
          operation: ['queryDatabase', 'getBlockChildren'],
        },
      },
      description: 'Number of items to return per page',
    },
    {
      name: 'startCursor',
      displayName: 'Start Cursor',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['queryDatabase', 'getBlockChildren'],
        },
      },
      description: 'Cursor for pagination',
    },
    {
      name: 'icon',
      displayName: 'Icon',
      type: 'json',
      default: {},
      displayOptions: {
        show: {
          operation: ['createPage', 'updatePage'],
        },
      },
      description: 'Icon object for the page',
    },
    {
      name: 'cover',
      displayName: 'Cover',
      type: 'json',
      default: {},
      displayOptions: {
        show: {
          operation: ['createPage', 'updatePage'],
        },
      },
      description: 'Cover object for the page',
    },
    {
      name: 'archived',
      displayName: 'Archived',
      type: 'boolean',
      default: false,
      displayOptions: {
        show: {
          operation: ['updatePage'],
        },
      },
      description: 'Whether to archive the page',
    },
  ],
});

export class NotionNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const credentials = context.credentials?.notion;
    
    if (!credentials) {
      return {
        success: false,
        error: 'Notion credentials not configured',
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }

    try {
      const notion = new Client({
        auth: credentials.token,
      });

      const { operation } = context.parameters;
      let result: any;

      switch (operation) {
        case 'queryDatabase':
          result = await this.queryDatabase(notion, context);
          break;
        case 'getDatabase':
          result = await this.getDatabase(notion, context);
          break;
        case 'createPage':
          result = await this.createPage(notion, context);
          break;
        case 'updatePage':
          result = await this.updatePage(notion, context);
          break;
        case 'getPage':
          result = await this.getPage(notion, context);
          break;
        case 'archivePage':
          result = await this.archivePage(notion, context);
          break;
        case 'getBlockChildren':
          result = await this.getBlockChildren(notion, context);
          break;
        case 'appendBlockChildren':
          result = await this.appendBlockChildren(notion, context);
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
          databaseId: context.parameters.databaseId,
          pageId: context.parameters.pageId,
        },
      };

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

  private async queryDatabase(notion: Client, context: NodeExecutionContext): Promise<any> {
    const { databaseId, filter, sorts, pageSize, startCursor } = context.parameters;

    const options: any = {
      database_id: databaseId,
    };

    if (filter && Object.keys(filter).length > 0) {
      options.filter = filter;
    }

    if (sorts && sorts.length > 0) {
      options.sorts = sorts;
    }

    if (pageSize) {
      options.page_size = Math.min(pageSize, 100); // Notion API limit
    }

    if (startCursor) {
      options.start_cursor = startCursor;
    }

    const response = await notion.databases.query(options);

    return {
      results: response.results,
      next_cursor: response.next_cursor,
      has_more: response.has_more,
      type: response.type,
      page_or_database: response.page_or_database,
    };
  }

  private async getDatabase(notion: Client, context: NodeExecutionContext): Promise<any> {
    const { databaseId } = context.parameters;

    const response = await notion.databases.retrieve({
      database_id: databaseId,
    });

    return response;
  }

  private async createPage(notion: Client, context: NodeExecutionContext): Promise<any> {
    const { databaseId, properties, children, icon, cover } = context.parameters;

    const options: any = {
      parent: {
        database_id: databaseId,
      },
      properties: properties || {},
    };

    if (children && children.length > 0) {
      options.children = children;
    }

    if (icon && Object.keys(icon).length > 0) {
      options.icon = icon;
    }

    if (cover && Object.keys(cover).length > 0) {
      options.cover = cover;
    }

    const response = await notion.pages.create(options);

    return response;
  }

  private async updatePage(notion: Client, context: NodeExecutionContext): Promise<any> {
    const { pageId, properties, icon, cover, archived } = context.parameters;

    const options: any = {
      page_id: pageId,
    };

    if (properties && Object.keys(properties).length > 0) {
      options.properties = properties;
    }

    if (icon && Object.keys(icon).length > 0) {
      options.icon = icon;
    }

    if (cover && Object.keys(cover).length > 0) {
      options.cover = cover;
    }

    if (archived !== undefined) {
      options.archived = archived;
    }

    const response = await notion.pages.update(options);

    return response;
  }

  private async getPage(notion: Client, context: NodeExecutionContext): Promise<any> {
    const { pageId } = context.parameters;

    const response = await notion.pages.retrieve({
      page_id: pageId,
    });

    return response;
  }

  private async archivePage(notion: Client, context: NodeExecutionContext): Promise<any> {
    const { pageId } = context.parameters;

    const response = await notion.pages.update({
      page_id: pageId,
      archived: true,
    });

    return response;
  }

  private async getBlockChildren(notion: Client, context: NodeExecutionContext): Promise<any> {
    const { pageId, pageSize, startCursor } = context.parameters;

    const options: any = {
      block_id: pageId,
    };

    if (pageSize) {
      options.page_size = Math.min(pageSize, 100); // Notion API limit
    }

    if (startCursor) {
      options.start_cursor = startCursor;
    }

    const response = await notion.blocks.children.list(options);

    return {
      results: response.results,
      next_cursor: response.next_cursor,
      has_more: response.has_more,
      type: response.type,
      block: response.block,
    };
  }

  private async appendBlockChildren(notion: Client, context: NodeExecutionContext): Promise<any> {
    const { pageId, children } = context.parameters;

    if (!children || children.length === 0) {
      throw new Error('Children blocks are required for append operation');
    }

    const response = await notion.blocks.children.append({
      block_id: pageId,
      children: children,
    });

    return response;
  }
}
